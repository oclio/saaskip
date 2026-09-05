export default {
  errors: {
    invalidCode: 'The code entered is incorrect or has expired.',
    invalidEmail: 'Invalid email address.',
    maxLength:
      'This field cannot exceed {limit} {limit, plural, one {character} other {characters}}',
    minLength:
      'This field must be at least {limit} {limit, plural, one {character} other {characters}}',
  },
  labels: {
    yourEmail: 'Your email',
    yourFirstName: 'Your first name',
    yourLastName: 'Your last name',
  },
  placeholders: {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
  },
} as const;
