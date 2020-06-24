### Andes Snomed Upgrade

Guía para actualizar a la versión 2020 de Snomed. 

1. Editar los endpoints de snowstorm en los archivos _js_.

2. Ejecutar la siguiente query y guardar el JSON resultante en el archivo `frecuentes-andes.json`:

```

db.getCollection('profesionalMeta').aggregate([
    { $unwind: '$frecuentes' },
    { $group: { _id: '$frecuentes.concepto.conceptId',  concepto: { $first: '$frecuentes.concepto'    } }  },
    { $replaceRoot : { newRoot: '$concepto' }  },
    { $project: { refsetIds: 0 } }
]).toArray()

```

3. Ejecutar los siguiente comandos: 


```
node inactive.js
node look-up-replace.js
inactivos-seguridos-list.js
```

