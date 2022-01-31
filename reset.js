import nodeFetch from "node-fetch";
import fetchCookie from "fetch-cookie/node-fetch.js";
import { CookieJar } from "tough-cookie";
import pkg from "json-2-csv";
const { json2csv } = pkg;
import { get, post, put } from "./handler.js";
import fs from "fs";

const all = { cards: [] };

const { email, password } = JSON.parse(fs.readFileSync("config.json"));
const { limit, exp } = JSON.parse(fs.readFileSync("resetConfig.json"));

const extendo = async (email, password) => {
  // LOGIN
  const session = fetchCookie(nodeFetch, new CookieJar());
  console.log(`[${email}] Logging in`);

  let res = await post(session, "https://api.paywithextend.com/lookup", {
    data: email,
  });

  let data = await res.json();

  if (data.status != "VERIFIED") {
    return console.log("INVALID EMAIL");
  }

  res = await post(session, "https://api.paywithextend.com/signin", {
    email,
    password,
  });

  if (res.status != 200) {
    return console.log("ERROR");
  }

  data = await res.json();

  const userId = data.user.id;
  const token = `Bearer ${data.token}`;

  console.log(`[${email}] Successfully logged in`);

  const fetchCardInfo = async (cardId) => {
    const res = await get(
      session,
      `https://v.paywithextend.com/virtualcards/${cardId}`
    );

    const data = await res.json();
    const cardData = data.virtualCard;
    const name = cardData.displayName;

    const number = cardData.vcn;
    const expiryTimestamp = cardData.expires;
    const month = expiryTimestamp.split("-")[1];
    const year = expiryTimestamp.split("-")[0];
    const cvv = cardData.securityCode;

    const _res = await put(
      session,
      `https://api.paywithextend.com/virtualcards/${cardId}`,
      {
        creditCardId: cardData.creditCardId,
        displayName: name,
        referenceFields: [],
        balanceCents: limit + "00",
        recurs: false,
        receiptAttachmentIds: [],
        validTo: exp,
        currency: "USD",
      },
      token
    );
    // const s = await _res.text();
    if (_res.status === 200) console.log(`[${name}] => $${limit} ${exp}`);
    else console.log(_res.status, await _res.text());

    all.cards.push({ name, number, month, year, cvv });
  };

  // FETCH INITIAL INFO
  console.log("Fetching cards");

  const tasks = [];

  res = await get(
    session,
    `https://api.paywithextend.com/virtualcards?count=50&page=0&recipient=${userId}&sortDirection=DESC&sortField=pendingUpdatedAt&statuses=ACTIVE&statuses=PENDING`,
    token
  );
  data = await res.json();

  const pages = data.pagination.numberOfPages;
  let cards = data.virtualCards;

  for (const key in cards) {
    tasks.push(fetchCardInfo(cards[key].id));
    await new Promise((r) => setTimeout(r, 1000));
  }

  // PAGINATE
  for (let page = 1; page < pages; page++) {
    res = await get(
      session,
      `https://api.paywithextend.com/virtualcards?count=50&page=${page}&recipient=${userId}&sortDirection=DESC&sortField=pendingUpdatedAt&statuses=ACTIVE&statuses=PENDING`,
      token
    );
    data = await res.json();

    cards = data.virtualCards;

    for (const key in cards) {
      tasks.push(fetchCardInfo(cards[key].id));
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await Promise.all(tasks);

  json2csv(all.cards, (err, csv) => {
    if (err) {
      throw err;
    }

    fs.writeFileSync("cards.csv", csv);
    console.log("-> cards.csv");
  });
};

extendo(email, password);
