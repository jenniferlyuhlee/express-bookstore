process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require('../app')
const db = require('../db')
const Book = require('../models/book')

let testBook;
let testData = {
    "isbn": "987654321",
    "amazon_url": "http://a.co/12345",
    "author": "Test Author",
    "language": "english",
    "pages": 400,
    "publisher": "Test Publiser",
    "title": "Test Title",
    "year": 2024
  }

let newTestData = {
    "isbn": "3000",
    "amazon_url": "http://a.co/3000",
    "author": "FAKE AUTHOR",
    "language": "english",
    "pages": 1000,
    "publisher": "FAKE PUBLISHER",
    "title": "FAKE TITLE",
    "year": 2023
  }

beforeEach(async () => {
    await db.query("DELETE FROM books");

    testBook = await Book.create(testData);
});

afterAll(async function() {
    await db.end();
});


describe('GET /books', () => {
    test('Gets all books', async () => {
        let resp = await request(app).get('/books');

        expect(resp.statusCode).toBe(200);
        expect(resp.body).toEqual({books: [testBook]})
    })
} )

describe('POST /books', () => {
    test('Creates new book entry', async () => {
        let resp = await request(app).post('/books')
        .send(newTestData)

        expect(resp.statusCode).toBe(201)
        expect(resp.body).toEqual({book: newTestData})
    })

    test('Schema validation: throws error when no data sent', async () => {
        let resp = await request(app).post('/books').send()

        expect(resp.statusCode).toBe(400)
    })

    test('Schema validation: Throws error when insufficient data sent', async () => {
        newTestData.author = null
        let resp = await request(app).post('/books')
        .send(newTestData);

        expect(resp.statusCode).toBe(400)
    })

    test('Schema validation: throws error when wrong format data sent', async () => {
        newTestData.pages = '250'
        newTestData.year = '1970'
        let resp = await request(app).post('/books')
        .send(newTestData);

        expect(resp.statusCode).toBe(400)
    })
})

describe('GET /books/:isbn', () => {
    test('Gets book by isbn', async () => {
        let resp = await request(app).get(`/books/${testData.isbn}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({book: testBook})
    })

    test('Responds with 404 with invalid isbn', async () => {
        let resp = await request(app).get(`/books/0000`)

        expect(resp.statusCode).toBe(404)
    })
})

describe('PUT /books/:isbn', () => {
    test('Edits book by isbn', async () => {
        let resp = await request(app).put(`/books/${testData.isbn}`)
        .send({"author": 'New Test Author',
                "amazon_url": "http://a.co/12345",
                "language": 'Spanish',
                "pages": 400,
                "publisher": "Test Publiser",
                "title": "New Test Title",
                "year": 2024
            });
        
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({book:{"isbn": "987654321",
                                        "amazon_url": "http://a.co/12345",
                                        "author": "New Test Author",
                                        "language": "Spanish",
                                        "pages": 400,
                                        "publisher": "Test Publiser",
                                        "title": "New Test Title",
                                        "year": 2024}});
    })

    test('Schema validation: throws error when no data sent', async () => {
        let resp = await request(app).put(`/books/${testData.isbn}`).send()

        expect(resp.statusCode).toBe(400)
    })

    test('Schema validation: throws error when isbn included in req.body', async () => {
        let resp = await request(app).put(`/books/${testData.isbn}`)
        .send({"isbn": '12345678',
                "author": 'Testing',
                "amazon_url": "http://a.co/12345",
                "language": 'Spanish',
                "pages": 400,
                "publisher": "Test Publiser",
                "title": "New Test Title",
                "year": 2024
            });

        expect(resp.statusCode).toBe(400)
    })

    test('Schema validation: Throws error when insufficient data sent', async () => {
        let resp = await request(app).put(`/books/${testData.isbn}`)
        .send({"amazon_url": "http://a.co/12345",
                "language": 'Spanish',
                "pages": 400,
                "publisher": "Test Publiser",
                "year": 2024
            });

        expect(resp.statusCode).toBe(400)
    })

    test('Schema validation: throws error when wrong format data sent', async () => {
        let resp = await request(app).put(`/books/${testData.isbn}`)
        .send({"author": false,
                "amazon_url": "http://a.co/12345",
                "language": 'Spanish',
                "pages": 'Four hundred',
                "publisher": "Test Publiser",
                "title": "New Test Title",
                "year": 2024
            });

        expect(resp.statusCode).toBe(400)
    })
})

describe('DELETE /books/:isbn', () => {
    test('Deletes book by isbn', async () => {
        let resp = await request(app).delete(`/books/${testData.isbn}`)

        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({ message: "Book deleted" })
    })

    test('Responds with 404 with invalid isbn', async () => {
        let resp = await request(app).delete(`/books/0000`)

        expect(resp.statusCode).toBe(404)
    })
})