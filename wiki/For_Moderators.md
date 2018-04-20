### Logging In

 The Owner will provide you a code in order to authorize you as a Moderator. To install the code, go to any article page,
    - On Windows, press Ctrl+Shift+J,
    - On Mac, press Cmd+Shift+J,
    - On Linux, use the top bar to open the JavaScript console,
and enter the following command:

‘localStorage.setItem(“modPassword”,”<code>”)’

Reload the page. If you have entered the password correctly, you will see all the moderator data.

If you receive an error which says “err_fail_decrypt”, you have entered a mistyped or incorrect password. To revoke an invalid password, type:

‘localStorage.removeItem(“modPassword”)’

### Features

When on the article page, next to every comment and next to the article itself, there will be a flag icon, and the number of reports that element has received (if no reports were filed, no icon will be shown)

The options button for each element should also expand. On both articles and comments, there will be a “Remove” button, which will remove the comment, or, if an article, all comments as well as the article data itself.

A “Rain” button will also appear only under comments. When pressed, it will set the number of votes on that comment will be set to 1 million (displayed as “1m”).

### Security Method

When an action must be authorized, a call is first made to ‘/api/admin/saltcount’. This page returns a number, incremented after each admin API call. The salt is then appended to the end of the encrypted message.

| API Call Name     | Type        | Bypasses IP limit & increments salt | Method                                                    |
|-------------------|-------------|-------------------------------------|-----------------------------------------------------------|
| report, saltcount | Unsecured                 | No                                  | No encryption or protection added, accessible to everyone                                                                                                                                                                                                                           |
| checkreports      | Data Return               | Yes                                 | Initial message to server encrypted as ‘&lt;callName>,&lt;articleID>,(&lt;commentID>,)&lt;salt>’ using AES from Google Code rollup. Invalid to server without proper encryption or beginning without API call name or ending without proper salt. Data returned without encryption. |
| remove, rain      | Executive                 | Yes                                 | Same method as data return. Always responds with ‘ok’ or error text.                                                                                                                                                                                                                |
| takedown          | Executive w/ Verification | No                                  | Same method as executive, except encrypted message must contain string defined in `takedownKey.txt`                                                                                                                                                                                 |
