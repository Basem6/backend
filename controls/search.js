const { client } = require("../utils/meili");

const MAX_LIMIT = 100;
const MAX_QUERY_LENGTH = 200;
const MAX_SKILLS = 20;

function parseInteger(value, name, defaultValue, minimum, maximum) {
    if (value === undefined || value === "") return defaultValue;
    if (!/^\d+$/.test(String(value))) {
        throw new Error(`${name} must be a non-negative integer`);
    }

    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
        throw new Error(`${name} must be between ${minimum} and ${maximum}`);
    }
    return parsed;
}

function parseNumber(value, name) {
    if (value === undefined || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${name} must be a non-negative number`);
    }
    return parsed;
}

function parseSkills(value) {
    if (value === undefined || value === "") return [];
    if (typeof value !== "string") throw new Error("skills must be a comma-separated string");

    const skills = value.split(",").map((skill) => skill.trim()).filter(Boolean);
    if (skills.length > MAX_SKILLS || skills.some((skill) => skill.length > 100 || /[\u0000-\u001f\u007f]/.test(skill))) {
        throw new Error(`skills must contain at most ${MAX_SKILLS} values of 100 characters each`);
    }
    return [...new Set(skills)];
}

function escapeFilterValue(value) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildSearchOptions(query, kind) {
    const page = parseInteger(query.page, "page", 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = parseInteger(query.limit, "limit", 20, 1, MAX_LIMIT);
    const minAmount = parseNumber(query[kind === "freelancers" ? "minRate" : "minBudget"], kind === "freelancers" ? "minRate" : "minBudget");
    const maxAmount = parseNumber(query[kind === "freelancers" ? "maxRate" : "maxBudget"], kind === "freelancers" ? "maxRate" : "maxBudget");
    const skills = parseSkills(query.skills);
    const q = query.q === undefined ? "" : query.q;

    if (typeof q !== "string" || q.length > MAX_QUERY_LENGTH) {
        throw new Error(`q must be a string of at most ${MAX_QUERY_LENGTH} characters`);
    }
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
        throw new Error("Minimum amount cannot exceed maximum amount");
    }
    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) {
        throw new Error("Requested page is too large");
    }

    const amountField = kind === "freelancers" ? "rate" : "budget";
    const filters = [];
    if (skills.length > 0) {
        filters.push(`(${skills.map((skill) => `skills = ${escapeFilterValue(skill)}`).join(" OR ")})`);
    }
    if (minAmount !== undefined) filters.push(`${amountField} >= ${minAmount}`);
    if (maxAmount !== undefined) filters.push(`${amountField} <= ${maxAmount}`);

    const sortOptions = kind === "freelancers"
        ? {
            "rate:asc": "rate:asc",
            "rate:desc": "rate:desc",
        }
        : {
            "budget:asc": "budget:asc",
            "budget:desc": "budget:desc",
            "createdAt:asc": "createdAt:asc",
            "createdAt:desc": "createdAt:desc",
        };

    if (query.sort && !sortOptions[query.sort]) {
        throw new Error("Unsupported sort value");
    }

    return {
        q: q.trim(),
        page,
        limit,
        options: {
            ...(filters.length > 0 ? { filter: filters.join(" AND ") } : {}),
            ...(query.sort ? { sort: [sortOptions[query.sort]] } : {}),
            limit,
            offset,
        },
    };
}

async function searchIndex(req, res, indexName) {
    let parsed;
    try {
        parsed = buildSearchOptions(req.query, indexName);
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    try {
        const result = await client.index(indexName).search(parsed.q, parsed.options);
        const total = result.estimatedTotalHits ?? result.hits.length;
        return res.status(200).json({
            success: true,
            [indexName]: result.hits,
            page: parsed.page,
            limit: parsed.limit,
            total,
            totalPages: Math.ceil(total / parsed.limit),
        });
    } catch (error) {
        console.error(`Meilisearch ${indexName} search failed:`, error);
        return res.status(503).json({ success: false, message: "Search is temporarily unavailable" });
    }
}

async function searchFreelancers(req, res) {
    return searchIndex(req, res, "freelancers");
}

async function searchJobs(req, res) {
    return searchIndex(req, res, "jobs");
}

module.exports = { searchFreelancers, searchJobs };
