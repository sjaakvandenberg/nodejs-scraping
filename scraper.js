'use strict';
const accountSid   = 'ACCOUNTSID';
const authToken    = 'AUTHTOKEN';
const twilioNumber = '+12345678900';
const yourNumber   = '+12345678900';
const intervalMins = .1;
const url          = 'http://www.amazon.com/dp/B00I15SB16';

// CommonJS requires

var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var prompt  = require('prompt');
var client  = require('twilio')(accountSid, authToken);

setInterval(function() {
  // this is the Amazon page for the Kindle

  request(url, function(error, response, html) {
    let price;
    let json = {
      price: '',
    };
    if (!error && response.statusCode == 200) {
      let $ = cheerio.load(html);

      // scrape product name
      $('span#productTitle').each(function(i, element) {
        let a = $(this);
        let product = a.text();

        let client = require('twilio')(accountSid, authToken);
        json.product = product;

        fs.readFile('price.json', function(err, data) {
          if (err) throw err;
          let obj = JSON.parse(data);
          if (obj.product != product) {
            console.log('Product name has changed.');
            fs.writeFile('price.json', JSON.stringify(json, null, 4), function(err) {
              console.log('Product name saved in price.json');
            });
          }
        });
      });

      // scrape product price
      $('span#priceblock_ourprice').each(function(i, element) {
        let a = $(this);
        let price = a.text();

        // require Twilio module and create REST client
        let client = require('twilio')(accountSid, authToken);
        json.price = price;

        fs.readFile('price.json', function(err, data) {
          if (err) throw err;
          let obj = JSON.parse(data);
          if (obj.price != price) {
            console.log('Price change detected. Sending text!');
            console.log('------------------------------------');
            console.log(`\nPRICE CHANGE:\n\nProduct: ${json.product}\nOld price: ${obj.price}\nNew price: ${json.price}`);

            client.messages.create({
              from: twilioNumber,
              to: yourNumber,
              body: `\nPRICE CHANGE:\n\nProduct: ${json.product}\nOld price: ${obj.price}\nNew price: ${json.price}`,
            });
            fs.writeFile('price.json', JSON.stringify(json, null, 4), function(err) {
              console.log('Price saved in price.json');
            });
          }
        });
      });
    }
  });

}, intervalMins * 60 * 1000);
