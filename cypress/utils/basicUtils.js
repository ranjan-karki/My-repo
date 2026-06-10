const veryLongParagraph = `
Automation testing is not only about verifying that a single button click produces the expected result;it is about building a 
comprehensive safety net that allows teams to deliver softwa at scalewithconfidence. A robust suite of automated tests can validate user flows,
edge cases, performance metrics,and even accessibility standards. When engineers design thesesuites, they often emphasize modularity,reusability, and clarity. 
A test that is easy to read today should remain easy to maintain six monthsfrom now, even after dozens of new featureshave been added. This is why practices 
such as page objects,custom commands, and utility libraries are so valuable. They transform brittle, repetitive scripts intoa framework that feels 
like an extension of the application itself.Consider the role of randomized data. Static inputs can only reveal so much; dynamic values uncoverunexpected
 behaviors. A search field mighthandle "hello world" correctly, but what happens when a user enters a 00‑character string, a sequence of numbers, or a mix 
 of symbols and emojis? Randomized testdata ensures that the system is resilient to the unpredictable nature of real‑world usage. This is where string generators,
 number factories, and email builders come into play. They provide endless variationsthat can be injected into tests, simulating thousands of unique users without 
 manual effort.Beyond functional correctness, automation supports broader goals. Performance testing validates thatpages load quickly under heavy traffic. 
Security checks confirm that sensitive endpoints are protected against unauthorized access. Accessibility audits guarantee that applications remain usable 
for people with diverse abilities. Each of these dimensions contributes to the overall quality of the product, and automation provides the repeatability needed
to measure them consistently.A long text block like this serves as a playground for automation engineers: it can be sliced into substrings, split into words,shuffled
 into random sequences, or concatenated into stress‑test inputs.The philosophy behind automation is simple yet profound: confidence through repetition. Every time atest
 runs successfully, it reinforces the belief that the system is stable. Every time a test fails, it offers an opportunity to improve. Over time, this cycle of 
 validation and correction builds a culture oftrust. Developers deploy code without fear, product owners releasefeatures without hesitation, and users enjoy 
 applications that behave reliably. The more extensive the test data, the stronger the foundation for this trust. That is why engineers often embed 
long, descriptive paragraphs into variables.These paragraphs become reservoirs of characters, words, and patterns that can be tapped for randomization,boundary 
testing, and exploratory scenarios.In practice, such text can be used to validate search inputs, form fields, database constraints, and APIpayloads. 
It can be broken into chunks of varying lengths, injected into loops, or combined with other data sources. It can simulate user comments, error messages,
or log entries. It can even be used to test how systems handle multilingual content, special characters, or whitespace variations. By keeping the text deliberately
verbose and neutral, engineers ensure that it remains flexible across contexts. Whether you are testing a small component or a large enterprise 
workflow, this kind of oversized paragraphprovides the raw material for creative, resilient, and future‑proof automation.`;

export const randomAlphaNumeric = (length) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
      return result;
  };

export const randomNumber = (digits) => {

  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;


  };


export const generateEmail = (length) => {

    const   emailString= randomAlphaNumeric(length);

    return emailString + '@example.com';
  };

export const getRandomSubstring = (length) => {
  const maxStartIndex = Math.max(0, veryLongParagraph.length - length);
  const startIndex = Math.floor(Math.random() * (maxStartIndex + 1));
  return veryLongParagraph.substring(startIndex, startIndex + length);
};

const mimeTypes = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  svg:  'image/svg+xml',
  gif:  'image/gif',
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  mp4:  'video/mp4',
};

export const uploadFile = (filePath) => {
  const ext      = filePath.split('.').pop().toLowerCase();
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  const fileName = filePath.split('/').pop();

  return cy.readFile(filePath, 'binary').then((fileContent) => {
    const blob     = Cypress.Blob.binaryStringToBlob(fileContent, mimeType);
    const formData = new FormData();
    formData.append('file', blob, fileName);

    return cy.wrap(
      fetch(`${Cypress.config('baseUrl')}/upload-resources`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${Cypress.env('token')}` },
        body:    formData,
      }).then((res) => res.json())
    );
  });
};
