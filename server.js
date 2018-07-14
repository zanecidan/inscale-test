var express = require('express');
var express_graphql = require('express-graphql');
var { buildSchema } = require('graphql');
var fs = require('fs');
const uuidv4 = require('uuid/v4');
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath:'transaction.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
    },
log = SimpleNodeLogger.createSimpleLogger( opts );

// GraphQL schema
var schema = buildSchema(`
    type Query {
        owner: [Owner]
        pet(owner: ID): [Pet]
    },
    type Mutation {
        addPet(
            owner: ID!, 
            name: String!, 
            colour: String!, 
            age: Int!, 
            breed: String!, 
            type: String!): Pet
        editPet(
            id: ID!,
            owner: ID, 
            name: String, 
            colour: String, 
            age: Int, 
            breed: String, 
            type: String): Pet
        removePet(id: ID): Pet
    },
    type Owner {
        id: ID
        name: String
        address: String
        phone: String
        email: String
    },
    type Pet {
        id: ID
        owner: ID
        name: String
        colour: String
        age: Int
        breed: String
        type: String
    }
`);

var ownerData;
var petData;

var getOwners = function() {
    const file = fs.readFileSync('./data/ownerData.json', 'utf8');
    ownerData = JSON.parse(file);
    log.info('getOwners');
    return ownerData;
}

var getPets = function(arg){
    const file = fs.readFileSync('./data/petData.json', 'utf8')
    petData = JSON.parse(file);

    if (arg.owner) {
        log.info('getPets for owner ID '+arg.owner);
        return petData.filter(pet => pet.owner == arg.owner);
    } else {
        log.info('getPets all');
        return petData;
    }
}

var addPet = function({owner, name, colour, age, breed, type}) {
    const file = fs.readFileSync('./data/petData.json', 'utf8')
    petData = JSON.parse(file);

    var newPet = {
        id: uuidv4(),
        owner: owner,
        name: name,
        colour: colour,
        age: age,
        breed: breed,
        type: type
    }
    petData.push(newPet);
    fs.writeFileSync('./data/petData.json', JSON.stringify(petData), 'utf8');
    log.info('addPet id '+ newPet.id);
    return newPet;
}

var editPet = function({id, owner, name, colour, age, breed, type}) {
    const file = fs.readFileSync('./data/petData.json', 'utf8')
    petData = JSON.parse(file);

    petData.map(pet => {
        if (pet.id === id) {
            if(name) pet.name = name;
            if(colour) pet.colour = colour;
            if(age) pet.age = age;
            if(breed) pet.breed = breed;
            if(type) pet.type = type;
            fs.writeFileSync('./data/petData.json', JSON.stringify(petData), 'utf8');
            log.info('editPet id '+pet.id);
            return pet;
        }
    });
    return petData.filter(pet => pet.id === id) [0];
}

var removePet = function({id}){
    const file = fs.readFileSync('./data/petData.json', 'utf8')
    petData = JSON.parse(file);
    petData = petData.filter(pet => pet.id != id);
    fs.writeFileSync('./data/petData.json', JSON.stringify(petData), 'utf8');
    log.info('removePet id '+id);
    return true;
}

// Root resolver
var root = {
    owner: getOwners,
    pet: getPets,
    addPet: addPet,
    editPet: editPet,
    removePet: removePet
};

// Create an express server and a GraphQL endpoint
var app = express();
app.use('/inscale', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}));
app.listen(4000, () => console.log('Server Now Running On localhost:4000/inscale'));