const cleanStringArray = (arr) => [
    ...new Set(
        arr
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
    ),
];
module.exports = {cleanStringArray};