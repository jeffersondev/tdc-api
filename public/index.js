function carregarTrilhas(event) {

    event.preventDefault();

    axios.get('/carregar-trilhas')
        .then(function (response) {

            let trilhas = response.data;

            // let trilhasHtml = `<thead>
            //                         <tr>
            //                             <th>id</th>
            //                             <th>trilha</th>
            //                             <th>url</th>
            //                         </tr>
            //                     </thead>`;
            // trilhasHtml += "<tbody>";

            // trilhas.forEach(t => {
            //     trilhasHtml += `<tr>
            //                         <td>${t.id}</td>
            //                         <td>${t.nome}</td>
            //                         <td><a href="${t.url}">${t.url}</a></td>
            //                     </tr>`;
            // });

            // trilhasHtml += "</tbody>";


            let trilhasHtml = "";
            trilhas.forEach(t => {

                trilhasHtml += "<p>" + JSON.stringify(t) + "</p>";
            });

            document.querySelector('#resultadoCarregarTrilhas').innerHTML = trilhasHtml;

            // console.log(trilhas);

        })
        .catch(function (error) {
            console.error(error);
        });
}