const headers = {
  accept: "application/vnd.paywithextend.v2021-03-12+json",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.20 Safari/537.36",
  "x-extend-brand": "br_2F0trP1UmE59x1ZkNIAqsg",
};

const get = async (session, url, auth) => {
  if (auth) {
    headers["authorization"] = auth;
  }
  let res = await session(url, { headers: headers });

  return res;
};

const post = async (session, url, data, auth) => {
  let res = await session(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.paywithextend.v2021-03-12+json",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/json",
      referer: "https://app.paywithextend.com/",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.20 Safari/537.36",
      "x-extend-brand": "br_2F0trP1UmE59x1ZkNIAqsg",
    },
    body: JSON.stringify(data),
  });

  return res;
};

export { get, post };
