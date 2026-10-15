const { Meilisearch } = require("meilisearch");

const client = new Meilisearch({
    host: "https://ms-6a9c75c68235-55314.par.meilisearch.io",
    apiKey: process.env.MEILI_ADMIN_KEY,
});

function toTimestamp(value) {
    if (value == null) return undefined;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : undefined;
}

function mapFreelancer(user) {
    const document = {
        id: String(user._id),
        title: user.specialty || user.major || "",
        skills: Array.isArray(user.skills) ? user.skills : [],
        name: user.fullName || "",
        image: user.image || "",
        bio: user.bio || "",
    };

    if (Number.isFinite(user.hourlyRate)) {
        document.rate = user.hourlyRate;
    }

    const createdAt = toTimestamp(user.createdAt);
    const updatedAt = toTimestamp(user.updatedAt);
    if (createdAt !== undefined) document.createdAt = createdAt;
    if (updatedAt !== undefined) document.updatedAt = updatedAt;

    return document;
}

function mapJob(project) {
    const document = {
        id: String(project._id),
        title: project.title || "",
        skills: Array.isArray(project.skills) ? project.skills : [],
        description: project.description || "",
        budget: Number.isFinite(project.budget) ? project.budget : 0,
        status: project.status || "open",
        client: String(project.clientId?._id || project.clientId || ""),
    };

    const createdAt = toTimestamp(project.createdAt);
    const updatedAt = toTimestamp(project.updatedAt);
    const deadline = toTimestamp(project.deadline);
    if (createdAt !== undefined) document.createdAt = createdAt;
    if (updatedAt !== undefined) document.updatedAt = updatedAt;
    if (deadline !== undefined) document.deadline = deadline;

    return document;
}

async function waitForTask(task) {
    const result = await client.tasks.waitForTask(task.taskUid);
    if (result.status !== "succeeded") {
        const reason = result.error?.message || `task status was ${result.status}`;
        throw new Error(`Meilisearch task ${result.taskUid} failed: ${reason}`);
    }
}

async function syncFreelancer(user) {
    try {
        const index = client.index("freelancers");
        if (user.role !== "freelancer") {
            await waitForTask(await index.deleteDocument(String(user._id)));
            return;
        }

        await waitForTask(await index.addDocuments([mapFreelancer(user)], { primaryKey: "id" }));
    } catch (error) {
        console.error("Failed to sync freelancer with Meilisearch:", error);
    }
}

async function syncJob(project) {
    try {
        const task = await client.index("jobs").addDocuments([mapJob(project)], { primaryKey: "id" });
        await waitForTask(task);
    } catch (error) {
        console.error("Failed to sync job with Meilisearch:", error);
    }
}

async function deleteJob(id) {
    try {
        const task = await client.index("jobs").deleteDocument(String(id));
        await waitForTask(task);
    } catch (error) {
        console.error("Failed to delete job from Meilisearch:", error);
    }
}

module.exports = {
    client,
    mapFreelancer,
    mapJob,
    syncFreelancer,
    syncJob,
    deleteJob,
};
