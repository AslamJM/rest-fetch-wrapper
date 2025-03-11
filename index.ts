// a response type or an error message 
type RestResponseType<T> = T | {
    message: string
}

class RestFetchWrapper {

    baseUrl: string
    defaultOptions: RequestInit
    accessToken: string
    refreshEndpoint: string

    constructor(
        baseUrl: string,
        accessToken: string,
        refreshEndpoint: string,
        defaultOptions: RequestInit = {}
    ) {
        this.baseUrl = baseUrl
        this.accessToken = accessToken
        this.refreshEndpoint = refreshEndpoint
        this.defaultOptions = {
            headers: {
                "Content-Type": "application/json",
            },
            ...defaultOptions
        }
    }

    async request<T>(
        endPoint: string,
        options: RequestInit = {},
        retry: boolean = true
    ): Promise<T> {
        const url = `${this.baseUrl}${endPoint}`
        const reqOptions: RequestInit = {
            ...this.defaultOptions,
            ...options,
            headers: {
                ...this.defaultOptions.headers,
                ...options.headers,
                Authorization: `Bearer ${this.accessToken}`
            }
        }

        try {
            const response = await fetch(url, reqOptions)
            const status = response.status

            if ((status === 401 || status === 403) && retry) {
                const newToken = await this.refreshToken()
                if (newToken) {
                    this.accessToken = newToken
                    return this.request(endPoint, options, false)
                } else {
                    // logout 

                }
            }

            if (!response.ok) {
                const err = await response.json() as { message: string }
                throw new Error(err.message)
            }

            const data = await response.json() as T
            return data

        } catch (error) {
            if ('message' in error) {
                throw error
            }

            throw new Error("Internal server error")
        }
    }

    async refreshToken() {
        try {
            const response = await fetch(`${this.baseUrl}${this.refreshEndpoint}`, {
                method: 'POST',
                credentials: "include"
            })
            if (!response.ok) {
                throw new Error("failed to refresh")
            }
            const data = await response.json() as { token: string }
            return data.token
        } catch (error) {
            throw error
        }
    }

    // REST methods 
    async getAll<T>(endPoint: string) {
        try {
            const data = await this.request<T>(endPoint, { method: "GET" })
            return data
        } catch (error) {
            throw error
        }
    }

    async create<B, R>(endPoint: string, body: B) {
        try {
            const data = await this.request<R>(endPoint, {
                method: 'POST',
                body: JSON.stringify(body)
            })
            return data
        } catch (error) {
            throw error
        }
    }

    async update<B, R>(endPoint: string, body: B) {
        try {
            const data = await this.request<R>(endPoint, {
                method: 'PATCH',
                body: JSON.stringify(body)
            })
            return data
        } catch (error) {
            throw error
        }
    }

    async delete<T>(endPoint: string) {
        try {
            const data = await this.request<T>(endPoint, {
                method: 'DELETE',

            })
            return data
        } catch (error) {
            throw error
        }
    }
}