const faqArticles = [];

const faqPageElements = {
    pageHeading: document.getElementById('pageHeading'),
    articleList: document.getElementById('faqList'),
    articleContainer: document.getElementById("articleContainer"),
    articleContent: document.getElementById("articleContent"),
}

async function init() {
    const faqArticleBackBtn = document.getElementById("articleBackBtn");
    const articles = await getArticles()

    // Заполнить главное меню кнопка с тайтлами статей
    articles.forEach(article => {
        const articleItem = document.createElement("li");
        const articleBtn = document.createElement("button");

        articleBtn.textContent = article.title;
        articleBtn.addEventListener("click", () => openArticle(article.id))

        articleItem.appendChild(articleBtn);

        faqPageElements.articleList.appendChild(articleItem);
    })

    faqArticleBackBtn.addEventListener("click", openArticleList);
    faqArticles.push(...articles);
}

async function getArticles() {
    try {
        const response = await fetch("../data/articles.json");

        if (!response.ok) {
            throw new Error(`HTTP ошибка, статус: ${response.status}`);
        }

        return await response.json()
    } catch (e) {
        console.error("Не удалось получить список статей: ", e);
        return [];
    }
}

function openArticle(id) {
    faqPageElements.pageHeading.style.display = "none";
    faqPageElements.articleList.style.display = "none";

    faqPageElements.articleContainer.style.display = "block";
    faqPageElements.articleContent.innerHTML = renderArticle(id);
}

function openArticleList() {
    faqPageElements.pageHeading.style.display = "";
    faqPageElements.articleList.style.display = "";

    faqPageElements.articleContainer.style.display = "";
    faqPageElements.articleContent.innerHTML = '';
}

function renderArticle(id) {
    const article = faqArticles.find(article => article.id === id);

    if (!article) return '<p>Статья не найдена</p>'
    const content = document.createElement("div");

    article.content.forEach(block => {
        let el;

        switch (block.type) {
            case "heading":
                el = document.createElement("h2");
                el.textContent = block.text;
                break;
            case "subheading":
                el = document.createElement("h3");
                el.textContent = block.text;
                break;
            case "paragraph":
                el = document.createElement("p");
                el.textContent = block.text;
                break;
            case "image":
                el = document.createElement("div");
                el.classList.add("image__container");
                const img = document.createElement("img");
                img.src = block.src;
                img.alt = block.alt;
                el.appendChild(img);
                break;
            default:
                return;
        }

        content.appendChild(el);
    })

    return content.innerHTML;
}

init()