// In-memory store for Web Push subscriptions keyed by userId
const subscriptions = new Map();

function save(userId, subscription) {
  subscriptions.set(userId, subscription);
}

function get(userId) {
  return subscriptions.get(userId);
}

function remove(userId) {
  subscriptions.delete(userId);
}

function getAll() {
  return Array.from(subscriptions.entries());
}

module.exports = {
  save,
  get,
  remove,
  getAll,
};