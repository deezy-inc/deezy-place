import axios from 'axios';
/**
 * @description service to call HTTP request via Axios
 */
class ApiService {
    /**
     * @description property to share axios _instance
     */
    _instance;
    /**
     * @description initialize vue axios
     */
    constructor(baseURL) {
        this._instance = axios.create({
            baseURL,
            headers: {
                'Content-type': 'application/json',
            },
        });
    }
    /**
     * @description set the default HTTP request headers
     */
    setHeader(key, value) {
        this._instance.defaults.headers.common[key] = value;
    }
    /**
     * @description send the GET HTTP request
     * @param resource: string
     * @param params: AxiosRequestConfig
     * @returns Promise<AxiosResponse>
     */
    async query(resource, params) {
        const result = await this._instance.get(resource, params);
        return result.data;
    }
    /**
     * @description send the GET HTTP request
     * @param resource: string
     * @param slug: string
     * @returns Promise<AxiosResponse>
     */
    async get(resource, slug = '') {
        const result = await this._instance.get(`${resource}/${slug}`);
        return result.data;
    }
    /**
     * @description set the POST HTTP request
     * @param resource: string
     * @param params: AxiosRequestConfig
     * @returns Promise<AxiosResponse>
     */
    async post(resource, params) {
        const result = await this._instance.post(`${resource}`, params);
        return result.data;
    }
    /**
     * @description send the UPDATE HTTP request
     * @param resource: string
     * @param slug: string
     * @param params: AxiosRequestConfig
     * @returns Promise<AxiosResponse>
     */
    async update(resource, slug, params) {
        const result = await this._instance.put(`${resource}/${slug}`, params);
        return result.data;
    }
    /**
     * @description Send the PUT HTTP request
     * @param resource: string
     * @param params: AxiosRequestConfig
     * @returns Promise<AxiosResponse>
     */
    async put(resource, params) {
        const result = await this._instance.put(`${resource}`, params);
        return result.data;
    }
    /**
     * @description Send the DELETE HTTP request
     * @param resource: string
     * @returns Promise<AxiosResponse>
     */
    delete(resource) {
        return this._instance.delete(resource);
    }
}
export default ApiService;
