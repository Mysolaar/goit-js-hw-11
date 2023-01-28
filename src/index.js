import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { debounce } from 'lodash';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('.search-form');
const searchFormInput = document.querySelector('.search-form__input');
const galleryElem = document.querySelector('.gallery');
const loadBtn = document.querySelector('.load-more');
const footerEle = document.querySelector('.footer');
const toTopBtn = document.querySelector('.btn-to-top');

let lastQuery = null;
let page = 1;
let totalPages = 0;

const lightbox = new SimpleLightbox('.gallery .gallery__item');
searchFormInput.focus();

// Fetching images
async function fetchImage(query, options, page) {
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: '33163838-5e8435841f895ee24b4a3058a',
        q: query,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: page,
        per_page: 40,
        ...options,
      },
    });

    totalPages = Math.ceil(response.data.totalHits / 40);

    // Notify
      
    if (response.data.totalHits === 0) {
      Notify.failure(`Sorry, there are no images matching your search query. Please try again.`, {
        position: 'right-top',
      });
    } else if (page === 1) {
      Notify.success(`Hooray! We found ${response.data.totalHits} images.`, {
        position: 'right-top',
      });
    }
    return response.data.hits;
  } catch (error) {
    console.log(error);
  }
}

// Makeing gallery
function updateGallery(imageData) {
  let imageHTML = '';
  imageData.forEach(image => {
    imageHTML += `
    <a class="gallery__item" href="${image.largeImageURL}">
    <figure class="gallery__figure">
      <img class="gallery__img" src="${image.webformatURL}" alt="${image.tags}" loading="lazy">
      <figcaption class="gallery__figcaption">
        <div class="gallery__caption">Likes: ${image.likes}</div>
        <div class="gallery__caption">Views: ${image.views}</div>
        <div class="gallery__caption">Comments: ${image.comments}</div>
        <div class="gallery__caption">Downloads: ${image.downloads}</div>
  </figcaption>
    </figure>
  </a>`;
  });

  galleryElem.innerHTML += imageHTML;
  lightbox.refresh();

  if (page === 1 && totalPages !== 0) {
    loadBtn.style.display = 'block';
  } else {
    loadBtn.style.display = 'none';
  }
}

// Are we at the bottom ?

const footerObserver = new IntersectionObserver(async function (entries, observer) {
  if (entries[0].isIntersecting === false) return;
  if (page >= totalPages) {
    Notify.info("You've reached the end of search results", {
      position: 'right-bottom',
    });
    return;
  }
  page += 1;
  const imageData = await fetchImage(lastQuery, {}, page);
  updateGallery(imageData);
});

// Debounced search function
const debouncedSearch = debounce(async function () {
  const query = searchFormInput.value;

  if (query === lastQuery) {
    return;
  } else {
    galleryElem.innerHTML = '';
  }

  lastQuery = query;
  page = 1;

  const imageData = await fetchImage(query, {}, page);
  updateGallery(imageData);
}, 300);

// submit form event listener
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  debouncedSearch();
});
// load more button event listener
loadBtn.addEventListener('click', async function () {
  page += 1;
  const imageData = await fetchImage(lastQuery, {}, page);
  updateGallery(imageData);
  footerObserver.observe(footerEle);
});

// Going back to the top
const moveOnTop = e => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

toTopBtn.addEventListener('click', moveOnTop);