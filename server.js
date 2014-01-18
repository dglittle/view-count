
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
        app.all(/\/view\/([^\/]+)/, function (req, res, next) {
            _.run(function () {
                try {
                    var key = req.params[0]

                    console.log('cookies: ', req.cookies)

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
                    var body = _.json(count)

                    var headers = {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Content-Length': Buffer.byteLength(body)
                    }
                    if (req.headers.origin) {
                        headers['Access-Control-Allow-Origin'] = req.headers.origin
                        headers['Access-Control-Allow-Credentials'] = 'true'
                    }
                    res.writeHead(200, headers)
                    res.end(body)
                } catch (e) {
                    next(e)
                }
            })
        })
    })
})
