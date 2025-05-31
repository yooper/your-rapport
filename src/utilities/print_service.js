import Mustache from 'mustache';

/**
 * Opens a print window with for the selected content
 * @param templateName
 * @param configuration
 * @returns {Promise<void>}
 */
export async function printPdfReport(templateName, configuration) {
  const reportBody = _mustacheService(templateName, configuration);
  const printWindow = window.open('', '', 'width=1000,height=800');
  printWindow.document.write(`
    <html>
      <head>
        <title>Your Rapport Report</title>
        <style>
          body {}
        </style>
      </head>
      <body>${reportBody}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  // introducing the delay addresses an issue with the pdf document image(s) being blank.
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 1000);
}

/**
 * Use Mustache to render the data.
 * TODO: Put validation in place.
 * @param templateName
 * @param configuration
 * @returns {*}
 * @private
 */
const _mustacheService = (templateName, configuration) => {
  const templateMap = {
    basic: _basicTemplate,
  };
  Mustache.escape = function (text) {
    return text;
  };
  const instance = Mustache.render(templateMap[templateName], configuration);
  return instance;
};

/**
 * TODO: use another site to host templates
 * @type {string}
 * @private
 */
const _basicTemplate = `
{{#records}}
<div>
<img src="{{screenshot}}" width="100%" height="80%"/>
</div>
<table>
    <tr>
        <td>
            <table>
                <tr>
                    <th>Domain</th>
                    <td>{{domain}}</td>
                </tr>
                <tr>
                    <th>Created On</th>
                    <td>{{createdOnLocalTime}}</td>
                </tr>
                <tr>
                    <th>Url</th>
                    <td>{{url}}</td>
                </tr>
                <tr>
                    <th>Hash</th>
                    <td>{{hash}}</td>
                </tr>
                <tr>
                    <th>Notes</th>
                    <td>{{note}}</td>
                </tr>                                                
            </table>
        </td>
    </tr>
</table>
{{/records}}
`;
