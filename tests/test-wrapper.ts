import FetchWrapper from "..";
import assert from 'assert'

const posts = [
  {
    id: 1,
    text: "posts 1",
  },
  {
    id: 2,
    text: "posts 2",
  },
];

let accessToken = "accessToken";

global.fetch = async (url: URL | RequestInfo, options: RequestInit | undefined) => {
  if (!options) {
    options = {}
  }
  url = String(url)

  if (url.includes("/posts") && options.method === "GET") {
    return new Response(JSON.stringify(posts), {
      status: 200
    })
  }

  if (url.includes("/refresh") && options.method === "POST") {
    return new Response(JSON.stringify({ token: "newAccessToken" }), { status: 200 })
  }

  if (url.includes("/authenticated")) {

    const token = options.headers?.Authorization?.split(" ")[1]
    if (token !== "newAccessToken") {
      return new Response(null, { status: 401 })
    }

    return new Response(JSON.stringify({ data: "success" }), { status: 200 })
  }

  return new Response(null, { status: 404 })
};

const api = new FetchWrapper("http://api.test.com", accessToken, "/refresh");

(async function runTests() {
  const postsData = await api.getAll("/posts");
  assert.deepEqual(posts, postsData)
  assert.equal(api.accessToken, accessToken)
  console.log("✅ passed: Successfull get request");
  console.log("✅ passed: Access Token is set");

  const authenticatedData = await api.getAll<{ data: string }>("/authenticated")
  assert.deepEqual(authenticatedData, { data: "success" })
  assert.deepEqual(api.accessToken, "newAccessToken")
  console.log("✅ passed: Successfully get authenticated request");
  console.log("✅ passed: Access Token is refreshed");

})();
