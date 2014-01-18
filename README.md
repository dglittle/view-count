view-count
==========

UNDER CONSTRUCTION

commands to set it up on heroku:

```
heroku apps:create view-count
heroku addons:add mongohq:sandbox

heroku config:set SESSION_SECRET=change_me

git push heroku master
```
