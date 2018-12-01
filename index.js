var express = require("express");
var bodyParser = require("body-parser");
var DataStore = require("nedb");
var cors = require('cors');
var path = require('path') 
const CONTACTS_APP_DIR = "/dist/contacts-app"; 


 var PORT = 3000;
 // Variable que configura la primera parte de nuestra dirección URL
 var BASE_API_PATH = "/api/v1";
 // contacts.json será el fichero local que hará de "BBDD"
 var dbFileName = __dirname + "/contacts.json";

 console.log("Starting API server...");

 var app = express();
 app.use(bodyParser.json());
 app.use(cors()); 

app.use(express.static(path.join(__dirname, CONTACTS_APP_DIR))); 
app.get('/', function(req, res) { 
res.sendFile(path.join(__dirname, CONTACTS_APP_DIR, '/index.html')); 

}); 

 var initialContacts = [
     { "name": "peter", "phone": 12345 },
     { "name": "john", "phone": 6789 }
 ];

 //Para inicializar la base de datos
 var db = new DataStore({
     filename: dbFileName,
     autoload: true
 });


// Método buscar de nedb. db.find{} devolvería todos los parámetros. Esta funcion tiene dos parámetros, el primero es un valor lógico (err) que indica si ha habido error o no
// el segundo, para ayudarme a implementar el conseguir todos los contactos. La función tiene dos variables, err por si
//hay algún error, y contacts donde estará el resultado de la búsqueda
 db.find({},(err,contacts)=>{
     if(err){
         console.error("Error accesing DB");
         process.exit(1);
     }else{
         if(contacts.length == 0){ //Si la lista de contactos es cero, inserto los contactos iniciales que tenemos en initialContacts
             console.log("Empty DB, initializaing data...");
             db.insert(initialContacts);
         }else{
             console.log("Loaded DB with "+contacts.length+" contacts.");
         }
            
     }
 });


 app.get(BASE_API_PATH + "/contacts", (req, res) => {
     // Obtain all contacts
     console.log(Date()+" - GET /contacts");
     
     db.find({},(err,contacts)=>{
         if(err){
             console.error("Error accesing DB");
             res.sendStatus(500);
         }else{
             res.send(contacts.map((contact)=>{
                 delete contact._id;
                 return contact;
             }));
         }
     });

 });

 app.post(BASE_API_PATH + "/contacts", (req, res) => {
     // Create a new contact
     console.log(Date()+" - POST /contacts");

     var contact = req.body;

     db.insert(contact);

     res.sendStatus(201);
 });

 app.put(BASE_API_PATH + "/contacts", (req, res) => {
     // El método put para todos los contactos está prohibido, no es un método aceptado, por eso devolvemos el código de estado 405 de prohibido
     console.log(Date()+" - PUT /contacts");

     res.sendStatus(405);
 });

 app.delete(BASE_API_PATH + "/contacts", (req, res) => {
     // Este método elimina todos los contactos.
     console.log(Date()+" - DELETE /contacts");

     db.remove({}); //Pasando la llave vacia a este método de nedb, lo elimina todo.
     
     res.sendStatus(200);
 });


 app.post(BASE_API_PATH + "/contacts/:name", (req, res) => {
     // Forbidden
     console.log(Date()+" - POST /contacts");

     res.sendStatus(405);
 });


//aquí los :name no es parte de la url, sino que es un caracter especial que express lo meterá dentro de la navariable name
//como accedo luego a ese name? con req.params.name
//Es decir, si yo me conecto a la dirección contacts/pepe, entonces pepe irá a la variable name
 app.get(BASE_API_PATH + "/contacts/:name", (req, res) => { 
     // Get a single contact
     var name = req.params.name;
     console.log(Date()+" - GET /contacts/"+name);

     db.find({"name": name},(err,contacts)=>{
         if(err){
             console.error("Error accesing DB");
             res.sendStatus(500);
         }else{
             if(contacts.length>1){
                 console.warn("Incosistent DB: duplicated name");
             }
             res.send(contacts.map((contact)=>{
                 delete contact._id;
                 return contact;
             })[0]);
         }
     });
 });


 app.delete(BASE_API_PATH + "/contacts/:name", (req, res) => {
     // Delete a single contact
     var name = req.params.name;
     console.log(Date()+" - DELETE /contacts/"+name);

     db.remove({"name": name},{},(err,numRemoved)=>{
         if(err){
             console.error("Error accesing DB");
             res.sendStatus(500);
         }else{
             if(numRemoved>1){
                 console.warn("Incosistent DB: duplicated name");
             }else if(numRemoved == 0) {
                 res.sendStatus(404);
             } else {
                 res.sendStatus(200);
             }
         }
     });
 });

 app.put(BASE_API_PATH + "/contacts/:name", (req, res) => {
     // Update contact
     var name = req.params.name;
     var updatedContact = req.body;
     console.log(Date()+" - PUT /contacts/"+name);

     if(name != updatedContact.name){
         res.sendStatus(409);
         return;
     }

     db.update({"name": name},updatedContact,(err,numUpdated)=>{
         if(err){
             console.error("Error accesing DB");
             res.sendStatus(500);
         }else{
             if(numUpdated>1){
                 console.warn("Incosistent DB: duplicated name");
             }else if(numUpdated == 0) {
                 res.sendStatus(404);
             } else {
                 res.sendStatus(200);
             }
         }
     });
 });

 app.listen(PORT);

 console.log("Server ready with static content!");