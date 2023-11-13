import { getRefreshToken, setAccessToken, setRefreshToken } from "../database";

const { NETATMO_CLIENT_ID, NETATMO_CLIENT_SECRET, NETATMO_REDIRECT_URL } = process.env;

const SCOPE = "read_station";
const REFRESH_TOKEN_TIMEOUT = 3600 * 1000;

const getNetatmoTokenUrl = () => `https://api.netatmo.com/oauth2/token`;

const getNetatmoConsentUrl = (state: string) => `https://api.netatmo.com/oauth2/authorize?client_id=${NETATMO_CLIENT_ID}&redirect_uri=${NETATMO_REDIRECT_URL}&scope=${SCOPE}&state=${state}`;


export class NetatmoAuthorization {

    private stateConfirmation?: string;

    public constructor() {
        this.refreshToken();
    }

    public displayAuthorizationUrl() {
        this.stateConfirmation = `${Math.random()}`
        console.log(`=====================================`)
        console.log(`Sign in using url: ${getNetatmoConsentUrl(this.stateConfirmation)}`)
        console.log(`=====================================`)
    }
 
    public async handleCodeResponse(url: URL){
        const code = url.searchParams.get("code")
        const state = url.searchParams.get("state")
    
        if (state !== this.stateConfirmation) {
            return new Response("Bad state!");
        }
        if (!code) {
            return new Response("No code!");
        }
    
        await this.exchangeCodeToToken(code)
        return new Response("OK");
    }
 
    private async retrieveToken(body: string) {
        const response = await fetch(getNetatmoTokenUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });
    
        if (!response.ok) {
            console.log(await response.json())
            throw new Error(response.statusText)
        }
    
        const { access_token, refresh_token } = await response.json();
        setAccessToken(access_token);
        setRefreshToken(refresh_token);
    }

    private async exchangeCodeToToken(code: string) {
        this.retrieveToken(`grant_type=authorization_code&client_id=${NETATMO_CLIENT_ID}&client_secret=${NETATMO_CLIENT_SECRET}&code=${code}&redirect_uri=${NETATMO_REDIRECT_URL}&scope=${SCOPE}`)
    }

    private async refreshToken() {
        console.log("Refreshing token...")
        this.retrieveToken(`grant_type=refresh_token&client_id=${NETATMO_CLIENT_ID}&client_secret=${NETATMO_CLIENT_SECRET}&refresh_token=${getRefreshToken()}`)
        setTimeout(this.refreshToken.bind(this), REFRESH_TOKEN_TIMEOUT);
    }

}