const fs = require("fs");
const cheerio = require('cheerio');
const fetch = require('node-fetch');

const cookie = "__cfduid=da0f5cf06f9caa8778ae8185bdc2844a91611923484; __gads=ID=4e399ae40a1bc625-22306e38ccb9005c:T=1611923496:RT=1611923496:S=ALNI_Ma7_jVkpos_6Xq9mflWofLPrGPQlA; _ga=GA1.2.1079578782.1611923492; _gid=GA1.2.1542031803.1611923492; _ym_d=1611923490; _ym_isad=2; _ym_uid=161192349067489942; currency=RUR; language=ru; SSID=fk26a22bk98stuuv21a5376jn6;";

(async function main() {
  const data = fs.readFileSync("input.txt").toString();

  for (let record of data.split("\n")) {
    await getArticle(...record.split(", "));
  }
})();

function getArticle(query, manufacturer) {
  console.log(query, manufacturer);
  const url = "https://japancars.ru/index.php?route=product/search&pn=" + query;

  return getRequest(url, cookie).then(function(body) {
    const $ = cheerio.load(body);

    if (/Товар с таким артикулом найден в каталогах нескольких производителей/.test(body)) {
      const newUrl = $("td.name a").filter(function() {
        return $(this).text().toLowerCase().trim() == manufacturer.toLowerCase().trim()
      }).attr("href");

      getRequest(newUrl, cookie).then(function(body) {
        storeData(query, body);
      });
    } else {
      storeData(query, body);
    }
  });
}

function storeData(query, body) {
  const $ = cheerio.load(body);

  fs.appendFile('data.csv', `\n\n=== ${query} ===\n` + $(".highlight").find($(".manufacturer, .part, .description")).map(function() {
      return $(this).text().replace(/\,/g, '').trim();
    }).get().reduce(function(accumulator, element, index) { 
      const offset = Math.floor(index / 3); 
      
      if (accumulator[offset]) { 
        accumulator[offset].push(element);
      } else { 
        accumulator[offset] = [element];
      } 
      
      return accumulator;
    }, []).map(row => row.join(", ")).join(",\n"), function(error) {
    });
}

function getRequest(url, cookie) {
  const options = {
    credentials: 'include',
    headers: { cookie }
  };

  return fetch(url, options).then(response => response.text());
}