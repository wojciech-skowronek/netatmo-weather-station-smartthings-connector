import { getAccessToken, getCO2Value, getLastUpdate, setCO2Value, setLastUpdate } from "../database";

const NETATMO_WEATHER_ENDPOINT = `https://api.netatmo.com/api/getstationsdata?get_favorites=false`;

export class NetatmoApi {

    public retrieveCO2Value = async () => {
        const response = await fetch(NETATMO_WEATHER_ENDPOINT, {
            method: "GET",
            headers: { "accept": "application/json", "Authorization": `Bearer ${getAccessToken()}` },
        });
    
        if (!response.ok) {
            console.log(await response.json())
            throw new Error(response.statusText)
        }
    
        const data = await response.json()
        setCO2Value(data.body.devices[0].dashboard_data.CO2)
        setLastUpdate();
    
        return new Response(JSON.stringify({ CO2: getCO2Value(), last_update: getLastUpdate() }));
    }    
}