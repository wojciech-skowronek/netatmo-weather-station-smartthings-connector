import ngrok from "@ngrok/ngrok";
import { getAccessToken, setAccessToken, setCO2Value, setRefreshToken, setLastUpdate, getCO2Value, getLastUpdate } from './database';
import { get } from "http";

const { NGROK_TOKEN, NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET, NETATMO_REDIRECT_URL, PORT } = process.env;
const SCOPE = "read_station";

const getNetatmoWeatherUrl = () => `https://api.netatmo.com/api/getstationsdata?get_favorites=false`;
const getNetatmoTokenUrl = () => `https://api.netatmo.com/oauth2/token`;
const getNetatmoConsentUrl = (state: string) => `https://api.netatmo.com/oauth2/authorize?client_id=${NETATMO_CLIENT_ID}&redirect_uri=${NETATMO_REDIRECT_URL}&scope=${SCOPE}&state=${state}`;

// todo: refactor to class
let stateConfirmation = "";

const exchangeCodeToToken = async (code: string) => {
    const response = await fetch(getNetatmoTokenUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=authorization_code&client_id=${NETATMO_CLIENT_ID}&client_secret=${NETATMO_CLIENT_SECRET}&code=${code}&redirect_uri=${NETATMO_REDIRECT_URL}&scope=${SCOPE}`
    });

    if (!response.ok) {
        console.log(await response.json())
        throw new Error(response.statusText)
    }

    const { access_token, refresh_token } = await response.json();
    setAccessToken(access_token);
    setRefreshToken(refresh_token);
}

const authorizePath = async (url: URL) => {
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    if (state !== stateConfirmation) {
        return new Response("Bad state!");
    }
    if (!code) {
        return new Response("No code!");
    }

    await exchangeCodeToToken(code)
    return new Response("OK");
}

const checkPath = async () => {
    const response = await fetch(getNetatmoWeatherUrl(), {
        method: "GET",
        headers: { "accept": "application/json", "Authorization": `Bearer ${getAccessToken()}` },
    });

    if (!response.ok) {
        console.log(await response.json())
        throw new Error(response.statusText)
    }

    const data = await response.json()
    console.log(data.body.devices[0].dashboard_data.CO2)
    setCO2Value(data.body.devices[0].dashboard_data.CO2)
    setLastUpdate();

    return new Response(JSON.stringify({ CO2: getCO2Value(), last_update: getLastUpdate() }));
}

const startServer = async () => {
    const server = Bun.serve({
        port: PORT,
        async fetch(req) {
            const url = new URL(req.url);
            switch (url.pathname) {
                case "/":
                    return authorizePath(url);
                    break;
                case "/check":
                    return checkPath();
                    break;
                default:
                    return new Response("Bad url!");
            }
        },
    });
}

const authorize = async () => {
    stateConfirmation = `${Math.random()}`
    console.log(`Sign in using url: ${getNetatmoConsentUrl(stateConfirmation)}`)
}

const main = async () => {
    startServer();
    await authorize();
}

main();