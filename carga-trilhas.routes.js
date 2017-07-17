const express = require('express'),
    router = express.Router(),
    jsdom = require("jsdom"),
    session = require('./session'),
    app = express(),
    {
        JSDOM
    } = jsdom;

router.get('/carregar-trilhas', (req, res) => {
    JSDOM.fromURL('http://www.thedevelopersconference.com.br/tdc/2017/saopaulo/trilhas')
        .then(async(dom) => {

            const document = dom.window.document;
            let dias = document.querySelectorAll('#trilhas-saopaulo div.row div.col-sp h4');
            let trilhasResponse = [];
            let diasSemana = new Set();

            for (let i = 0; i < dias.length; i++) {
                if (i > 4) break;

                let dia = dias[i];
                let diaSemana = dia.textContent.split('|')[0].trim();
                let diaMes = dia.textContent.split('|')[1].trim();

                diasSemana.add(diaSemana);

                let trilha = dia.nextElementSibling;

                while (trilha != null) {

                    let nome = trilha.text.trim();
                    let url = trilha.href.toString();

                    if (!url.includes('trilha') || nome == '-') {
                        trilha = trilha.nextElementSibling;
                        continue;
                    }

                    trilhasResponse.push(criarTrilha(nome, url, diaSemana, diaMes));

                    trilha = trilha.nextElementSibling;
                }
            }

            session.trilhas = await criarRelacionamentoTrilhas(diasSemana, trilhasResponse);
            res.json(session.trilhas);
        })
        .catch(err => {

            console.error(err);
            res.status(500).send(err);
        });
});

async function criarRelacionamentoTrilhas(diasSemana, trilhas) {

    let trilhasRelacionadas = [];

    for (let dia of diasSemana) {

        let trilhasDia = trilhas.filter(t => t.diaSemana == dia);
        let trilhaStadium = trilhasDia.find(t => t.id.includes('stadium'));

        for (let index = 0; index < trilhasDia.length; index++) {

            let t = trilhasDia[index];

            if (t != trilhaStadium) {

                t.trilhaRelacionada.push(trilhaStadium);

                const dom = await JSDOM.fromURL(t.url);
                let trilhaNaoListada = tratarTrilhaDoisEmUm(dom.window.document, trilhasDia, t);

                if (trilhaNaoListada) {

                    trilhaNaoListada.trilhaRelacionada.push(trilhaStadium);
                    trilhasRelacionadas.push(trilhaNaoListada);
                }
                trilhasRelacionadas.push(t);
            } else {

                trilhasRelacionadas.push(t);
            }
        }
    }

    return limparEstruturaCircular(trilhasRelacionadas);
}

function tratarTrilhaDoisEmUm(document, trilhasDia, trilha) {

    let titulo = document.querySelector('.titulo-trilha');

    if (titulo.textContent.includes(' + ')) {

        let links = document.querySelectorAll('a[href*=trilha-]');
        let url = "";

        if (links[0].text.trim().toUpperCase() == trilha.nome) {

            url = links[0].href.toString();
            trilha.id = url.substring(url.indexOf('/trilha-') + 8);
            trilha.url = url;

            let trilhaPar = trilhasDia.filter(t => {
                return t.nome == links[1].text.trim().toUpperCase();
            });

            if (trilhaPar.length) {

                trilha.trilhaRelacionada.push(trilhaPar[0]);
            } else {

                let trilhaNaoListada = criarTrilha(links[1].text.trim().toUpperCase(), links[1].href.toString(), trilha.diaSemana, trilha.diaMes);
                trilhaNaoListada.trilhaRelacionada.push(trilha);
                trilha.trilhaRelacionada.push(trilhaNaoListada);
                return trilhaNaoListada;
            }
        } else if (links[1].text.trim().toUpperCase() == trilha.nome) {

            url = links[1].href.toString();
            trilha.id = url.substring(url.indexOf('/trilha-') + 8);
            trilha.url = url;

            let trilhaPar = trilhasDia.filter(t => {
                return t.nome == links[0].text.trim().toUpperCase();
            });

            if (trilhaPar.length) {

                trilha.trilhaRelacionada.push(trilhaPar[0]);
            } else {

                let trilhaNaoListada = criarTrilha(links[0].text.trim().toUpperCase(), links[0].href.toString(), trilha.diaSemana, trilha.diaMes);
                trilhaNaoListada.trilhaRelacionada.push(trilha);
                trilha.trilhaRelacionada.push(trilhaNaoListada);
                return trilhaNaoListada;
            }
        } else {

            console.error('não foi possível tratar a trilha', trilha);
        }

    }
}

function limparEstruturaCircular(trilhas) {

    return trilhas.map(t => {

        return {
            "id": t.id,
            "diaSemana": t.diaSemana,
            "diaMes": t.diaMes,
            "nome": t.nome,
            "url": t.url,
            "trilhaRelacionada": t.trilhaRelacionada.map(r => {
                return {
                    "id": r.id,
                    "diaSemana": r.diaSemana,
                    "diaMes": r.diaMes,
                    "nome": r.nome,
                    "url": r.url
                }
            })
        }
    });
}

function criarTrilha(nome, url, diaSemana, diaMes) {

    let id = "";

    if (url.includes('/trilha-')) {

        id = url.substring(url.indexOf('/trilha-') + 8);
    } else if (url.includes('/trilhas-')) {

        id = url.substring(url.indexOf('/trilhas-') + 9);
    }

    return {
        "id": id,
        "diaSemana": diaSemana,
        "diaMes": diaMes,
        "nome": nome,
        "url": url,
        "trilhaRelacionada": []
    }
}

module.exports = router;