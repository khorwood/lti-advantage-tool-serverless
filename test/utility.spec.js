'use strict';

const { expect } = require('chai');

const Utility = require('../src/utility');

describe('utility', () => {
    it('returns autopost form', () => {
        let data = {
            item: 'value',
            item2: 'value2'
        };

        let html = Utility.autoPostForm('https://google.com', data);

        const expected = `<html>
<body>
    <form action="https://google.com" method="post" name="myform">
        <input type="hidden" name="item" value="value" /><input type="hidden" name="item2" value="value2" />
        <input type="submit" />
    </form>
    <script language="javascript">
        document.myform.submit();
    </script>
</body>
</html>`;

        expect(html).to.equal(expected);
    });
});
