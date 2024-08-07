import axios from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';


const WIKI_API_URL = import.meta.env.VITE_WIKI_API_URL as string;

const wikiAPI = axios.create({ baseURL: WIKI_API_URL });

type ResponseType = AxiosRequestConfig['responseType'];

// implement a method to execute all the request from here.
const apiRequest =
    (method: AxiosRequestConfig['method']) =>
        <ResponseT = unknown>(
            url: AxiosRequestConfig['url'],
            data: unknown,
            params: unknown,
            withCredentials: boolean = true,
            responseType: ResponseType = 'json'
        ) => {
            const headers = {
                authorization: ''
            };

            //using the axios instance to perform the request that received from each http method
            return wikiAPI({
                method,
                url,
                params: params,
                data,
                headers,
                responseType,
                withCredentials: withCredentials
            }).then((res: AxiosResponse<ResponseT>) => {
                return { data: res.data, headers: res.headers };
            });
        };

// expose your method to other services or actions
export const WIKI_API = {
    get: apiRequest('get'),
    delete: apiRequest('delete'),
    post: apiRequest('post'),
    put: apiRequest('put'),
    patch: apiRequest('patch')
};
