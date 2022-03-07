import axios from 'axios';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://127.0.0.1:55055/';

const axiosAPI = axios.create({ baseURL: API_URL });

type ResponseType = AxiosRequestConfig['responseType'];

// implement a method to execute all the request from here.
const apiRequest =
	(method: AxiosRequestConfig['method']) =>
	<ResponseT = unknown>(
		url: AxiosRequestConfig['url'],
		data: unknown,
		responseType: ResponseType = 'json'
	) => {
		const headers = {
			authorization: ''
		};
		//using the axios instance to perform the request that received from each http method
		return axiosAPI({
			method,
			url,
			data,
			headers,
			responseType,
			withCredentials: true
		}).then((res: AxiosResponse<ResponseT>) => {
			return { data: res.data, headers: res.headers };
		});
	};

// expose your method to other services or actions
export const API = {
	get: apiRequest('get'),
	delete: apiRequest('delete'),
	post: apiRequest('post'),
	put: apiRequest('put'),
	patch: apiRequest('patch')
};
