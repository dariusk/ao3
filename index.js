var exec = require('child_process').exec;
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');
_.mixin( require('underscore.deferred') );
var inflection = require('inflection');
var Twit = require('twit');
var T = new Twit(require('./config.js'));
var wordfilter = require('wordfilter');
var ent = require('ent');
var conf = require('./config.js');
// need to use this OTHER twitter lib to post photos, sigh
var Twitter = require('node-twitter');
var twitterRestClient = new Twitter.RestClient(
  conf.consumer_key,
  conf.consumer_secret,
  conf.access_token,
  conf.access_token_secret
);
var Tumblr = require('tumblrwks');
var tumblr = new Tumblr(
  {
    consumerKey:    conf.tumblr_consumer_key,
    consumerSecret: conf.tumblr_consumer_secret,
    accessToken:    conf.tumblr_access_token,
    accessSecret:   conf.tumblr_access_token_secret
  }, "au-prompts.tumblr.com"
  // you can specify the blog url now or the time you want to use
);
var Bing = require('node-bing-api')({ accKey: conf.bingKey});

var debug = false;

Array.prototype.pick = function() {
  return this[Math.floor(Math.random()*this.length)];
};

Array.prototype.pickRemove = function() {
  var index = Math.floor(Math.random()*this.length);
  return this.splice(index,1)[0];
};

function getImages(first, second) {
  console.log(first, second);
  var dfd = _.Deferred();
  Bing.images(first, {skip: Math.floor(Math.random()*5)}, function(error, response, body){
    var url1 = body.d.results[Math.floor(Math.random()*3)].MediaUrl;
    ur1l = url1.replace(/\%3F.*/,'');
    Bing.images(second, {skip: Math.floor(Math.random()*5)}, function(error, response, body){
      var url2 = body.d.results[Math.floor(Math.random()*3)].MediaUrl;
      ur12 = url2.replace(/\%3F.*/,'');
      console.log(url1, url2);
      var filetype1 = '.png';//url1.match(/\.\w\w\w\w?$/)[0].toLowerCase();
      var filetype2 = '.png';//url2.match(/\.\w\w\w\w?$/)[0].toLowerCase();
      var stream1 = fs.createWriteStream('./1' + filetype1);
      var stream2 = fs.createWriteStream('./2' + filetype2);
      stream1.on('close', function() {
        var r = request(url2).pipe(stream2);
      });
      stream2.on('close', function() {
        console.log('done');
        dfd.resolve('./1' + filetype1, './2' + filetype2);
      });
      var r = request(url1).pipe(stream1);
    });
  });
  return dfd.promise();
}

function generate() {
  var dfd = new _.Deferred();
  var urls = ['http://archiveofourown.org/tags/Harry%20Potter%20-%20J*d*%20K*d*%20Rowling/works',
  'http://archiveofourown.org/tags/Sherlock%20Holmes%20*a*%20Related%20Fandoms/works',
  'http://archiveofourown.org/tags/Lost/works',
  'http://archiveofourown.org/tags/Scandal%20(TV)/works',
  'http://archiveofourown.org/tags/Marvel/works',
  'http://archiveofourown.org/tags/One%20Direction%20(Band)/works',
  'http://archiveofourown.org/tags/DCU/works',
  'http://archiveofourown.org/tags/Supernatural/works',
  'http://archiveofourown.org/tags/Dragon%20Age%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Final%20Fantasy/works',
  'http://archiveofourown.org/tags/Mass%20Effect/works',
  'http://archiveofourown.org/tags/Star%20Wars%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Teen%20Wolf%20(TV)/works',
  'http://archiveofourown.org/tags/Star%20Trek:%20The%20Original%20Series/works',
  'http://archiveofourown.org/tags/Star%20Trek:%20The%20Next%20Generation/works',
  'http://archiveofourown.org/tags/Game%20of%20Thrones%20(TV)/works',
  'http://archiveofourown.org/tags/Doctor%20Who%20*a*%20Related%20Fandoms/works',
  'http://archiveofourown.org/tags/The%20Lord%20of%20the%20Rings%20(Movies)/works',
  'http://archiveofourown.org/tags/Battlestar%20Galactica%20(2003)/works',
  'http://archiveofourown.org/tags/Buffy%20the%20Vampire%20Slayer/works',
  'http://archiveofourown.org/tags/Friday%20Night%20Lights/works',
  'http://archiveofourown.org/tags/The%20X-Files/works',
  'http://archiveofourown.org/tags/due%20South/works',
  'http://archiveofourown.org/tags/Community%20(TV)/works',
  'http://archiveofourown.org/tags/Gilmore%20Girls/works',
  'http://archiveofourown.org/tags/Once%20Upon%20a%20Time%20(TV)/works',
  'http://archiveofourown.org/tags/Parks%20and%20Recreation/works',
  'http://archiveofourown.org/tags/Sailor%20Moon%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/Vampire%20Diaries%20(TV)/works',
  'http://archiveofourown.org/tags/Veronica%20Mars%20(TV)/works',
  'http://archiveofourown.org/tags/Twilight%20Series%20-%20All%20Media%20Types/works',
  'http://archiveofourown.org/tags/The%20West%20Wing/works',
  'http://archiveofourown.org/tags/Xena:%20Warrior%20Princess/works',
  'http://archiveofourown.org/tags/Hetalia:%20Axis%20Powers/works',
  'http://archiveofourown.org/tags/%E5%BC%B1%E8%99%AB%E3%83%9A%E3%83%80%E3%83%AB%20%7C%20Yowamushi%20Pedal/works',
  'http://archiveofourown.org/tags/Haikyuu!!/works'
  ];

  var result = [],
      resultCount = 0;
  _.each(urls, function (url) {
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        // parse stuff and resolve
        var fandom = $('h2.heading > a').text();
        fandom = fandom.replace(/[\-\(\:\&\|].*$/,'');
        // "DCU" gets you a toy line, "DC" gets better results
        if (fandom === 'DCU') {
          fandom = 'DC';
        }
//        console.log(fandom);
        var names = $('#tag_category_character > ul > li').map(function(ind, el) { return($(el).text().replace(/\(.*\)/,'').trim())});
        names = _.map(names, function(name) {
          return {
            name: name,
            fandom: fandom
          };
        });
        result.push(names);
        resultCount++;
        // if we've gathered all the results
        if (result.length === urls.length) {
          // Grab potential settings from twitter
          _.when(
              search('"wish I was in"'),
              search('"pretend we\'re in"')
            )
            .done(function() {
              var res = _.flatten(arguments);
              console.log(res);
              var settings = _.chain(res)
                .map(function(el) {
                  return inflection.titleize(el.replace(/(\.|,|!|\?).*/,'').trim());
                })
                .reject(function(el) {
                  return el.match(/\si\s/i) !== null || el.length > 25 || el.length <= 2;
                })
                .value();
              //console.log(settings);

              result = _.flatten(result);
              var first = result.pick();
              var second = result.pick();
              getImages('"' + first.name + '" ' + first.fandom, '"' + second.name + '" ' + second.fandom)
                .done(function(file1, file2) {
                  console.log(file1, file2);
                  exec('mogrify -resize 200x200^ -gravity center -extent 200x200 ' + file1 + '[0]').on('close', function() {
                    exec('mogrify -resize 200x200^ -gravity center -extent 200x200 ' + file2 + '[0]').on('close', function() {
                      exec('convert ' + file1 + ' ' + file2 + ' +append out.png').on('close', function() {
                        var image = [
                          'heart.gif',
                          'broken_heart.gif'
                        ].pick();
                        exec('composite -gravity center ' + image + ' out.png out2.png').on('close', function() {
                          exec('rm 1* && rm 2* && cp out2.png ~/Downloads');
                          var myTweet = first.name + ' and ' + second.name + ' in ' + settings.pick();
                          console.log(myTweet);
                          if (first.fandom === 'Doctor Who') {
                            first.fandom = 'Doctor Who Universe';
                          }
                          if (second.fandom === 'Doctor Who') {
                            second.fandom = 'Doctor Who Universe';
                          }
                          if (!wordfilter.blacklisted(myTweet) && !debug) {
                            // Tweet it
                            twitterRestClient.statusesUpdateWithMedia({
                                'status': myTweet,
                                'media[]': 'out2.png'
                              },
                              function(error, result) {
                                if (error) {
                                  console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
                                }
                                if (result) {
                                  console.log(result);
                                  // Tumblr it
                                  tumblr.post('/post', {
                                    type: 'photo',
                                    source: result.entities.media[0].media_url,
                                    caption: myTweet,
                                    tags: ['AU Prompts',first.name,second.name,first.fandom,second.fandom,first.name+'/'+second.name].join(',')
                                    }, function(err, json){
                                    console.log(json, err);
                                  });  
                                }
                            });


                          }
                          console.log('done');
                        });
                      });
                    });
                  });

                });
            });
        }
      }
      else {
        dfd.reject();
      }
    });
  });
  return dfd.promise();
}

function search(term) {
  var dfd = new _.Deferred();
  T.get('search/tweets', { q: term, count: 100 }, function(err, reply) {
    var tweets = reply.statuses;
    tweets = _.chain(tweets)
      .map(function(el) {
        if (el.retweeted_status) {
          return ent.decode(el.retweeted_status.text);
        }
        else {
          return ent.decode(el.text);
        }
      })
      .map(function(el) {
        var reg = new RegExp('.*'+term.replace(/"/g,''),'i');
        return el.replace(reg,'');
      })
      .reject(function(el) {
        // filtering out substring of "Antarctica" because of a stupid song lyric
        return (el.indexOf('#') > -1 || el.indexOf('http') > -1 || el.indexOf('@') > -1 || el.indexOf('"') > -1 || el.indexOf(':') > -1 || el.toLowerCase().indexOf('antar') > -1);
      })
      .uniq()
      .value();
    dfd.resolve(tweets);
  });
  return dfd.promise();
}


// tweet once, this is meant to be run on a cron job
generate();
