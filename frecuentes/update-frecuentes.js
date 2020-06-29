const fetch = require('node-fetch');
const { MongoClient, ObjectId } = require('mongodb');
const para_reemplazar = require('./conceptos-para-reemplazar.json');


function InactivosReemplazoMap() {
    const map = {};
    para_reemplazar.forEach((item) => {
        map[item.conceptId] = item;
    })
    return map;
}

async function main() {
    const inactivosReemplazoMap = InactivosReemplazoMap();

    const conn = await MongoClient.connect('mongodb://localhost:27017/andes');
    const db = conn.db('andes');
    const ProfesionalMeta = db.collection('profesionalMeta');

    const documents = ProfesionalMeta.find();

    for await (const doc of documents) {
        const len = doc.frecuentes.length;
        for (let i = 0; i < doc.frecuentes.length; i++) {
            const freq = doc.frecuentes[i];

            const inactivoObject = inactivosReemplazoMap[freq.concepto.conceptId];
            if (inactivoObject) {
                if (inactivoObject.replace_id) {
                    // console.log('ANTES', freq.concepto)
                    const newConcept = await getConcept(inactivoObject.replace_id);
                    freq.concepto.conceptId = newConcept.conceptId
                    freq.concepto.fsn = newConcept.fsn.term;
                    freq.concepto.term = newConcept.pt.term;
                    freq.concepto.semanticTag = getSemanticTagFromFsn(newConcept.fsn.term);
                } else {
                    // console.log(freq.concepto.conceptId)
                    doc.frecuentes.splice(i, 1);
                    i--;
                }
            }

        }
        if (len !== doc.frecuentes.length) {
            // console.log(JSON.stringify(doc.frecuentes))
            console.log(len, doc.frecuentes.length, doc._id);
        }
        const id = doc._id;
        delete doc._id;
        await ProfesionalMeta.update({ _id: id }, doc);

    }
    console.log('DONE');
    process.exit();
}

const cacheConceptos = {};
async function getConcept(id) {
    if (cacheConceptos[id]) {
        return cacheConceptos[id];
    }

    const concepto = await fetch('http://snowtest.andes.gob.ar:8080/browser/MAIN/ODONTO/NEUQUEN/concepts/' + id, {
        headers: { 'Content-Type': 'application/json', 'Accept-Language': 'es' },
    }).then(res => res.json());
    cacheConceptos[id] = concepto;
    return concepto;
}

function getSemanticTagFromFsn(fsn) {
    const startAt = fsn.lastIndexOf('(');
    const endAt = fsn.lastIndexOf(')');
    return fsn.substring(startAt + 1, endAt);
}

main();