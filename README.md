view-count
==========

commands to set it up on heroku:

```
heroku apps:create view-count
heroku addons:add mongohq:sandbox

heroku config:set SESSION_SECRET=change_me

git push heroku master
```

assuming it is running at http://view-count.herokuapp.com, here's how to add a view counter with JavaScript:

```
$.ajax({
    url : 'http://view-count.herokuapp.com/view/' + encodeURIComponent(location.href),
    xhrFields : { withCredentials: true },
    success : function (count) { alert(count) }
})   
```

to view the counts for tracked urls, just visit http://view-count.herokuapp.com

note that it supports CORS and uses cookies to track uniqueness.
