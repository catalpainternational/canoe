import { openDB, deleteDB, wrap, unwrap } from "idb";

const action_store_name = "actions";

// store an action of a certain type
export async function writeAction(action) {
    action.synced = 0;
    const actionsDb = await db();
    return actionsDb.put(action_store_name, action);
}

// get all actions of a type
export async function readActions(type) {
    const actionsDb = await db();
    return actionsDb.getAllFromIndex(
        action_store_name,
        "type",
        IDBKeyRange.bound([type], [type, ""])
    );
}

// get all actions not yet known to be synced to the server
export async function unsyncedActions() {
    const actionsDb = await db();
    return await actionsDb.getAllFromIndex(action_store_name, "synced", 0);
}

// set an action in the database as synced to the server
export async function markActionAsSynced(action) {
    const actionsDb = await db();
    action.synced = 1;
    return actionsDb.put(action_store_name, action);
}

// store an api action to idb if required
export async function ensureAction(action) {
    const actionsDb = await db();
    const transaction = actionsDb.transaction(action_store_name, "readwrite");
    const key = await transaction.store.getKey(action.uuid);

    const thisYear = new Date().getFullYear();
    const beginningOfThisYear = new Date(thisYear, 0, 1);

    // return false - no change made; ignore actions from prior years.
    if (key || action.date < beginningOfThisYear) {
        return false;
    }

    action.synced = 1;
    await transaction.store.add(action);
    // return true - change made
    return true;
}

let _db = null;

export async function db() {
    _db =
        _db ||
        (await openDB(action_store_name, 1, {
            upgrade(db, oldVersion, newVersion, transaction) {
                const objectStore = db.createObjectStore(action_store_name, { keyPath: "uuid" });

                objectStore.createIndex("type", ["type", "date"], { unique: false });
                objectStore.createIndex("synced", "synced", { unique: false });
            },
            blocked() {
                console.log("blocked");
            },
            blocking() {
                console.log("blocking");
            }
        }));
    return _db;
}

export async function closeAndDeleteDB() {
    _db.close();
    _db = null;
    return await deleteDB(action_store_name);
}
