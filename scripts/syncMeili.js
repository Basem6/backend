require("dotenv").config();

const mongoose = require("mongoose");
const { client, mapFreelancer, mapJob } = require("../utils/meili");
const Freelancer = require("../models/Freelancer");
const Project = require("../models/Project");

const BATCH_SIZE = 500;

const indexSettings = {
    freelancers: {
        searchableAttributes: ["title", "skills", "name", "bio"],
        filterableAttributes: ["skills", "rate", "rating"],
        sortableAttributes: ["rate", "rating"],
    },
    jobs: {
        searchableAttributes: ["title", "skills", "description"],
        filterableAttributes: ["skills", "budget", "status", "client"],
        sortableAttributes: ["budget", "createdAt"],
    },
};

async function waitForTask(task) {
    const result = await client.tasks.waitForTask(task.taskUid);
    if (result.status !== "succeeded") {
        const reason = result.error?.message || `task status was ${result.status}`;
        throw new Error(`Meilisearch task ${result.taskUid} failed: ${reason}`);
    }
}

async function applySettings(index, settings) {
    for (const [setting, values] of Object.entries(settings)) {
        const task = await index[`update${setting[0].toUpperCase()}${setting.slice(1)}`](values);
        await waitForTask(task);
    }
}

async function addCursorDocuments(index, query, mapper) {
    const cursor = query.lean().cursor();
    let batch = [];
    let count = 0;

    try {
        for await (const document of cursor) {
            batch.push(mapper(document));
            count += 1;

            if (batch.length === BATCH_SIZE) {
                await waitForTask(await index.addDocuments(batch, { primaryKey: "id" }));
                batch = [];
            }
        }

        if (batch.length > 0) {
            await waitForTask(await index.addDocuments(batch, { primaryKey: "id" }));
        }
    } finally {
        await cursor.close();
    }

    return count;
}

async function sync() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is required");
    }
    if (!process.env.MEILI_ADMIN_KEY) {
        throw new Error("MEILI_ADMIN_KEY is required");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const counts = {};
    for (const [uid, settings] of Object.entries(indexSettings)) {
        const index = client.index(uid);
        await applySettings(index, settings);
        await waitForTask(await index.deleteAllDocuments());

        const query = uid === "freelancers" ? Freelancer.find({ role: "freelancer" }) : Project.find({});
        const mapper = uid === "freelancers" ? mapFreelancer : mapJob;
        counts[uid] = await addCursorDocuments(index, query, mapper);
        console.log(`Synced ${counts[uid]} documents to "${uid}"`);
    }

    return counts;
}

sync()
    .catch((error) => {
        console.error("Meilisearch full sync failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
