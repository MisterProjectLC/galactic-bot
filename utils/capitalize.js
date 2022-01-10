
module.exports.capitalize = (string) => {
    return string.length > 0 ? (string.charAt(0).toUpperCase() + (string.length > 1 ? string.slice(1) : "")) : "";
}