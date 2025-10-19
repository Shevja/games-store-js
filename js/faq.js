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
        faqPageElements.articleContent.appendChild("<p>Не удалось получить список статей</p>")
        return [];
    }
}

function openArticle(id) {
    faqPageElements.pageHeading.style.display = "none";
    faqPageElements.articleList.style.display = "none";

    faqPageElements.articleContainer.style.display = "block";
    faqPageElements.articleContent.innerHTML = '';

    faqPageElements.articleContent.appendChild(renderArticle(id));
}

function openArticleList() {
    faqPageElements.pageHeading.style.display = "";
    faqPageElements.articleList.style.display = "";

    faqPageElements.articleContainer.style.display = "";
    faqPageElements.articleContent.innerHTML = '';
}

function renderArticle(id) {
    const article = faqArticles.find(article => Number(article.id) === Number(id));
    const articleIdx = faqArticles.findIndex(article => Number(article.id) === Number(id));

    if (!article) {
        const errText = document.createElement("p")
        errText.textContent = 'Статья не найдена';
        return errText
    }
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
            case "link":
                el = document.createElement("a");
                el.href = block.href;
                el.textContent = block.text;
                break;
            case "image":
                el = document.createElement("div");
                el.classList.add("image__container");
                const img = document.createElement("img");
                img.src = block.src;
                img.alt = block.alt;
                img.addEventListener('click',  () => openFullscreenImage(img.src))
                el.appendChild(img);
                break;
            case "video":
                el = document.createElement("div");
                el.classList.add("video__container");
                const videoIframe = document.createElement("iframe");
                videoIframe.src = block.src;
                videoIframe.width = block.width || "960";
                videoIframe.frameBorder = "0";
                videoIframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                videoIframe.allowFullscreen = true;
                el.appendChild(videoIframe);
                break;
            default:
                return;
        }

        // Если обрабатываемый элемент - ссылка и последний добавленный элемент - текст
        // то добавляем ссылку к тексту
        if(el.tagName === "A" && content.lastChild && content.lastChild.tagName === "P") {
            content.lastChild.append(" ");
            content.lastChild.appendChild(el)
        } else {
            content.appendChild(el);
        }
    })

    const byeText = document.createElement("h3");
    byeText.textContent = "Погрузиться бы во что нибудь с головой! Приятной игры! ©XboxRent";
    byeText.align = "center";
    content.appendChild(byeText);

    const nextArticleIdx = articleIdx === faqArticles.length - 1 ? 0 : articleIdx + 1;
    const nextArticleTitle = faqArticles[nextArticleIdx].title;
    const nextArticleBtn = document.createElement("button");
    nextArticleBtn.classList.add("article__next");
    nextArticleBtn.addEventListener("click", () => openArticle(nextArticleIdx));
    nextArticleBtn.textContent = nextArticleTitle;
    content.appendChild(nextArticleBtn);

    return content;
}

init()