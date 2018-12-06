# Advanced react

An [advanced react course](https://advancedreact.com/) from Wes Bos.
Some code restructure based on latest tech update :
* Change all react class components to functional components
* Implement react hooks to replace react class setState function
* Implement prisma client for db query

## Software requirement

* [Docker](https://www.docker.com/)
* [Node.js](https://nodejs.org/en/)
* [Prisma](https://www.prisma.io/)


## Installation && Setup
*  Backend

```
#
$ cd api
$ cp .env.example .env
$ npm i
$ prisma deploy
$ npm start
```

*  Frontend
```
#
$ cd web
$ npm i
$ nom run dev
```

## URL
API : http://localhost:5555/
WEB : http://localhost:7777/
