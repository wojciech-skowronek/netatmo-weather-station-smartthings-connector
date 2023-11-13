import {NetatmoApi} from './classes/NetatmoApi';
import {NetatmoAuthorization} from './classes/NetatmoAuthorization';

const { PORT } = process.env;

const startServer = async (netatmoAuthorization: NetatmoAuthorization) => {
    const server = Bun.serve({
        port: PORT,
        async fetch(req) {
            const url = new URL(req.url);
            switch (url.pathname) {
                case "/":
                    return netatmoAuthorization.handleCodeResponse(url);
                    break;
                case "/check":
                    return new NetatmoApi().retrieveCO2Value();
                    break;
                default:
                    return new Response("Bad url!");
            }
        },
    });
}

const main = async () => {
    const netatmoAuthorization = new NetatmoAuthorization();
    startServer(netatmoAuthorization);
    netatmoAuthorization.displayAuthorizationUrl();
}

main();