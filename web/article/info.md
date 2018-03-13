## Reading Vote Statistics

Key | X Axis                | Y Axis
--- | --------------------- | ---------------------
<S  | Strongly Voting Left  | Strongly Left Aligned
<M  | Normally Voting Left  | Normally Left Aligned
<W  | Weakly Voting Left    | Weakly Left Aligned
<C> | Voting in Center      | ---
W>  | Weakly Voting Right   | Weakly Right Aligned
M>  | Normally Voting Right | Normally Right Aligned
S>  | Strongly Voting Right | Strongly Right Aligned

### Color Calculation

Name      | Value                             | Condition
--------- | --------------------------------- | ----------
rating    | percentage from 1-100             |
f.rating  | rating / 100                      |
low byte  | 255 * f                           |
high byte | 255                               |
color     | rgb(low byte,low byte,high byte)  | rating < 0
color     | rgb(high byte,low byte,low byte ) | rating > 0
color     | rgb(low byte,low byte,low byte )  | rating = 0

### Download

Download statistics in JSON format from `/api/stats?<id>`.

Download statistics in CSV format from `/api/stats?<id>,csv`.

- Uses same table format as website
- Gives results as full count, not percentage
- Votes may be obfuscated
