
var _ = require('gl519')
require('./server_utils.js')

_.run(function () {
    defaultEnv("PORT", 5000)
    defaultEnv("NODE_ENV", "production")
    defaultEnv("MONGOHQ_URL", "mongodb://localhost:27017/viewcount")
    defaultEnv("SESSION_SECRET", "super_secret")

    var db = require('mongojs')(process.env.MONGOHQ_URL)
    var rpc_version = 1
    var rpc = {}

    rpc.getViews = function (arg, req) {
        return _.p(db.collection('views').find({}).sort({ count : -1 }, _.p()))
    }

    createServer(db, process.env.PORT, process.env.SESSION_SECRET, rpc_version, rpc, function (app) {

        function send(req, res, body) {
            var mime = 'text/plain'
            if (typeof body != 'string') {
                body = _.json(body)
                mime = 'application/json'
            }
            var headers = {
                'Content-Type': mime + '; charset=utf-8',
                'Content-Length': Buffer.byteLength(body)
            }
            if (req.headers.origin) {
                headers['Access-Control-Allow-Origin'] = req.headers.origin
                headers['Access-Control-Allow-Credentials'] = 'true'
            }
            res.writeHead(200, headers)
            res.end(body)
        }

        app.all(/\/set\/([^\/]+)/, function (req, res, next) {
            _.run(function () {
                try {
                    var key = req.params[0]
                    var value = req.method.match(/post/i) ? req.body : _.unescapeUrl(req.url.match(/\?(.*)/)[1])
                    _.p(db.collection('keyvalues').update({ _id : key }, { $set : { value : value } }, { upsert : true }, _.p()))
                    send(req, res, true)
                } catch (e) {
                    next(e)
                }
            })
        })

        app.all(/\/get\/([^\/]+)/, function (req, res, next) {
            _.run(function () {
                try {
                    var key = req.params[0]
                    var value = _.p(db.collection('keyvalues').findOne({ _id : key }, _.p()))
                    send(req, res, value ? value.value : '')
                } catch (e) {
                    next(e)
                }
            })
        })

        app.all(/\/view\/([^\/]+)/, function (req, res, next) {
            _.run(function () {
                try {
                    var key = req.params[0]
                    if (!req.cookies.viewed) {
                        res.cookie('viewed', 'true', { path : req.path , maxAge : 1000 * 60 * 60 * 24 * 365 })
                        var count = _.p(db.collection('views').findAndModify({
                            query : { _id : key },
                            update : { $inc : { count : 1 } },
                            new : true,
                            upsert : true
                        }, _.p())).count
                    } else {
                        var count = _.p(db.collection('views').findOne({ _id : key }, _.p())).count
                    }
                    send(req, res, count)
                } catch (e) {
                    next(e)
                }
            })
        })
    })
})
