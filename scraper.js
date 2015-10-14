'use strict';
var accountSid   = 'ACCOUNTSID';
var authToken    = 'AUTHTOKEN';
var twilioNumber = '+12345678900';
var yourNumber   = '+12345678900';
var intervalMins = .1;
var url          = 'http://www.amazon.com/dp/B00I15SB16';

// CommonJS requires

var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var prompt  = require('prompt');
var client  = require('twilio')(accountSid, authToken);

setInterval(function() {
  // this is the Amazon page for the Kindle

  request(url, function(error, response, html) {
    var price;
    var json = {
      price: '',
    };
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html);

      // scrape product name
      $('span#productTitle').each(function(i, element) {
        var a = $(this);
        var product = a.text();

        var client = require('twilio')(accountSid, authToken);
        json.product = product;

        fs.readFile('price.json', function(err, data) {
          if (err) throw err;
          var obj = JSON.parse(data);
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
        var a = $(this);
        var price = a.text();

        // require Twilio module and create REST client
        var client = require('twilio')(accountSid, authToken);
        json.price = price;

        fs.readFile('price.json', function(err, data) {
          if (err) throw err;
          var obj = JSON.parse(data);
          if (obj.price != price) {
            console.log('Price change detected. Sending text!');
            console.log('------------------------------------');
            console.log('\nPRICE CHANGE:\n');
            console.log('Product: ' + json.product);
            console.log('Old Price: ' + obj.price);
            console.log('New Price: ' + json.price + '\n');

            client.messages.create({
              from: twilioNumber,
              to: yourNumber,
              body: '\nPRICE CHANGE:\n' +
                    'Product: ' + json.product +
                    'Old Price: ' + obj.price +
                    'New Price: ' + json.price,
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
