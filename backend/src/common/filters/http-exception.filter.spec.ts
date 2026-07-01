import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function makeHost(json: jest.Mock) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json,
      }),
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as any;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: jest.Mock;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = jest.fn();
  });

  it('formats an HttpException with an explicit code and message', () => {
    const ex = new HttpException({ code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' }, 404);

    filter.catch(ex, makeHost(json));

    expect(json).toHaveBeenCalledWith({
      error: { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found', statusCode: 404 },
    });
  });

  it('joins class-validator array messages with "; " and sets code to VALIDATION_ERROR', () => {
    const ex = new HttpException({ message: ['name must not be empty', 'email must be valid'] }, 400);

    filter.catch(ex, makeHost(json));

    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'name must not be empty; email must be valid',
        statusCode: 400,
      },
    });
  });

  it('derives code from HTTP status when no explicit code is provided', () => {
    const ex = new HttpException('Not found', 404);

    filter.catch(ex, makeHost(json));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) }),
    );
  });

  it('returns 500 INTERNAL_SERVER_ERROR for an unhandled Error', () => {
    const ex = new Error('Something blew up');

    filter.catch(ex, makeHost(json));

    expect(json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred', statusCode: 500 },
    });
  });

  it.each([
    [400, 'VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [422, 'UNPROCESSABLE_ENTITY'],
    [429, 'RATE_LIMIT_EXCEEDED'],
    [500, 'INTERNAL_SERVER_ERROR'],
  ])('maps HTTP %i to code %s', (status, expectedCode) => {
    const ex = new HttpException('error', status as HttpStatus);

    filter.catch(ex, makeHost(json));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: expectedCode }) }),
    );
  });
});
