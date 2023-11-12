import { Database } from "bun:sqlite";

const init = async () => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS data (
            name TEXT PRIMARY KEY,
            value TEXT
        );
    `);
}

const db = new Database("mydb.sqlite");
await init();


export const insertSingle = (name: string, value: string) => {
    const insert = db.query(`INSERT INTO data(name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value=excluded.value;`);
    insert.run(name, value)
}

export const selectSingle = (name: string) => {
    const select = db.query<{value: string}, string>(`SELECT value FROM data WHERE name = ?`);
    return select.get(name)?.value
}

export const setAccessToken = (value: string) => {
    return insertSingle("access_token", value)
}

export const setRefreshToken = (value: string) => {
    return insertSingle("refresh_token", value)
}

export const setCO2Value = (value: string) => {
    return insertSingle("CO2", value)
}
export const setLastUpdate = () => {
    return insertSingle("last_update", new Date().toISOString())
}

export const getAccessToken = () => {
    return selectSingle("access_token")
}

export const getRefreshToken = () => {
    return selectSingle("refresh_token")
}

export const getCO2Value = () => {
    return selectSingle("CO2")
}

export const getLastUpdate = () => {
    return selectSingle("last_update")
}