## Reading Vote Statistics

---       | X Axis                | Y Axis
--------- | --------------------- | ---------------------
&lt;S     | Strongly Voting Left  | Strongly Left Aligned
&lt;M     | Normally Voting Left  | Normally Left Aligned
&lt;W     | Weakly Voting Left    | Weakly Left Aligned
&lt;C&gt; | Voting in Center      | ---
W&gt;     | Weakly Voting Right   | Weakly Right Aligned
M&gt;     | Normally Voting Right | Normally Right Aligned
S&gt;     | Strongly Voting Right | Strongly Right Aligned

### Color Calculation

Name      | Value                             | Condition
--------- | --------------------------------- | ----------
rating    | percentage from 1-100             |
f.rating  | rating / 100                      |
low byte  | 255 * f                           |
high byte | 255                               |
color     | rgb(low byte,low byte,high byte)  | rating < 0
color     | rgb(high byte,low byte,low byte) | rating > 0
color     | rgb(low byte,low byte,low byte)  | rating = 0

### Download

Download statistics in JSON format from `/api/stats?<id>`.

Download statistics in CSV format from `/api/stats?<id>,csv`.

- Uses same table format as website
- Gives results as full count, not percentage
- Votes may be obfuscated
