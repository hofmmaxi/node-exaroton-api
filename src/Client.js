const got = require('got');

const Server = require('./Server/Server');
const RequestStatusError = require('./Error/RequestStatusError');
const RequestBodyError = require('./Error/RequestBodyError');
const GetServersRequest = require('./Request/GetServersRequest');

const packageConfig = require('../package.json');

class Client {
    /**
     * API base URL used for all requests
     *
     * @type {string}
     */
    baseURL = "https://api.exaroton.com/v1/";

    /**
     * API token used for authentication
     *
     * @type {string|null}
     * @private
     */
    _apiToken = null;

    /**
     * User agent sent with all requests
     *
     * @type {string}
     * @private
     */
    _userAgent = "node-exaroton-api@" + packageConfig.version;

    /**
     * Client constructor
     *
     * @param {string} apiToken string API token, create one here: https://exaroton.com/account/
     */
    constructor(apiToken) {
        this.setAPIToken(apiToken);
    }

    /**
     * Set the API token
     *
     * @param {string} apiToken
     * @return {this}
     */
    setAPIToken(apiToken) {
        if (typeof apiToken !== "string") {
            throw new Error("Invalid API token, expected string, but got " + typeof apiToken);
        }

        this._apiToken = apiToken;
        return this;
    }

    /**
     * Set the user agent
     *
     * @param {string} userAgent
     * @return {this}
     */
    setUserAgent(userAgent) {
        if (typeof userAgent !== "string") {
            throw new Error("Invalid user agent, expected string, but got " + typeof userAgent);
        }

        this._userAgent = userAgent;
        return this;
    }

    /**
     * Send a {Request} to the API and get a {Response}
     *
     * @param {Request} request
     * @return {Response}
     * @throws {RequestError}
     */
    async request(request) {
        request.client = this;
        const url = this.baseURL + request.getEndpoint();
        const headers = Object.assign({
            "authorization": "Bearer " + this._apiToken,
            "user-agent": this._userAgent
        }, request.headers);

        let gotOptions = {
            method: request.method,
            retry: 0,
            headers: headers,
            responseType: "json"
        };

        if (request.hasBody()) {
            gotOptions.body = request.getBody();
        }

        let response;
        try {
            response = await got(url, gotOptions);
        } catch (e) {
            throw new RequestStatusError(e);
        }

        if (response.body.success) {
            return request.createResponse(response.body);
        } else {
            throw new RequestBodyError(response);
        }
    }

    /**
     * Get a list of all servers
     *
     * @return {Response}
     * @throws {RequestError}
     */
    async getServers() {
        return (await this.request(new GetServersRequest)).getData();
    }

    /**
     * Initialize a new server object
     *
     * @param {string} id
     * @return {Server}
     */
    server(id) {
        return new Server(this, id);
    }
}

module.exports = Client;