import { useState, useEffect, useMemo, useRef } from 'react'; 
import './App.scss';
import { fetchTeaserData } from './services/api';
import { dataLayerPushView, dataLayerPushSeeAllClick, dataLayerPushLinkGlobalClick } from './services/analytics';
import { db } from './services/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import LoadingOverlay from './components/LoadingOverlay/LoadingOverlay';
import TwitterEmbed from './components/TwitterEmbed/TwitterEmbed';
import InstagramEmbed from './components/InstagramEmbed/InstagramEmbed';
import YouTubeEmbed from './components/YouTubeEmbed/YouTubeEmbed';
import timelineData from './assets/json/data.json';

import imgLa from './assets/img/la.png';
import imgDc from './assets/img/dc.png';
import imgDenver from './assets/img/denver.png';
import imgMiami from './assets/img/miami.png';
import imgNy from './assets/img/ny.png';
import imgLivre from './assets/img/livre.jpg';

// Déclaration du composant principal App
function App() {
// Déclaration des états locaux :
    // - `calendar` : Contient les données du calendrier récupérées depuis Firestore.
    // - `showAll` : Indique si tous les éléments du calendrier doivent être affichés.
    // - `loading` : Indique si les données sont en cours de chargement.
    const [docId, setDocId] = useState(null);
    const [teaser, setTeaser] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState(0); // Index du filtre sélectionné (0 = premier élément)

    // Fonction exécutée lorsque la page est chargée
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const teaserDoc = urlParams.get('teaserDoc'); // Récupère la valeur du paramètre `teaserDoc`.

        if (!teaserDoc) {
            console.log('Aucun teaser trouvé.');
            return;
        }

        dataLayerPushView(teaserDoc); // Appeler la fonction déplacée
        setDocId(teaserDoc); // Met à jour l'état `docId` avec la valeur de teaserDoc

        async function loadTeaser() {
            try {
                const data = await fetchTeaserData(teaserDoc); // Appel à l'API pour récupérer les données.
                
                // Vérifier que les données ont été récupérées correctement
                if (data && data.teaserTitle) {
                    setTeaser(data); // Mise à jour de l'état `teaser` avec les données récupérées.
                    
                    // Incrémenter le compteur de vues après le chargement des données
                    await incrementViewCounter(teaserDoc);
                    
                    // Le chargement est terminé SEULEMENT si les données sont valides
                    setLoading(false);
                } else {
                    console.error('Données du teaser manquantes ou incorrectes');
                    // Le loading reste à true si les données ne sont pas valides
                }
            } catch (error) {
                console.error('Erreur lors du chargement du teaser:', error);
                // Le loading reste à true en cas d'erreur
            }
        }

        loadTeaser();
    }, []); // Le tableau de dépendances vide signifie que cet effet est exécuté une seule fois.


    async function incrementClickCounter(docId) {
        try {
            const calendarRef = doc(db, 'embeds', docId); // Remplacez 'questions' par le nom de votre collection
            await updateDoc(calendarRef, {
                counterLinkGlobalClicks: increment(1), // Incrémente la valeur de 1
            });
            //console.log('Compteur de clics incrémenté dans Firestore');
            dataLayerPushLinkGlobalClick(docId); // Appel de la fonction pour envoyer l'événement au dataLayer
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation du compteur :', error);
        }
    }

    async function incrementViewCounter(docId) {
        try {
            const teaserRef = doc(db, 'embeds', docId);
            await updateDoc(teaserRef, {
                counterViews: increment(1), // Incrémente la valeur de 1
            });
            //console.log('Compteur de vues incrémenté dans Firestore');
        } catch (error) {
            console.error('Erreur lors de l\'incrémentation du compteur de vues :', error);
        }
    }

    const handleLinkGlobalClick = () => {
        incrementClickCounter(docId);
    };

    // Mapping des noms d'images vers les variables importées
    const imageMap = {
        'imgLa': imgLa,
        'imgDc': imgDc,
        'imgDenver': imgDenver,
        'imgMiami': imgMiami,
        'imgNy': imgNy
    };

    // Fonction pour obtenir l'image correspondante
    const getImageForItem = (imgName) => {
        //console.log('Image demandée:', imgName, 'Résultat:', imageMap[imgName]);
        return imageMap[imgName] || null;
    };

    // Fonction pour gérer le changement de filtre avec animation
    const handleFilterChange = (filterIndex) => {
        // Si on change de filtre, on reset les animations
        if (filterIndex !== selectedFilter) {
            setSelectedFilter(filterIndex);
            
            // Petit délai pour permettre au DOM de se mettre à jour
            setTimeout(() => {
                // Force le re-déclenchement de l'animation
                const activeContent = document.querySelector('.timeline-content-active');
                if (activeContent) {
                    activeContent.classList.remove('timeline-content-active');
                    // Force reflow
                    activeContent.offsetHeight;
                    activeContent.classList.add('timeline-content-active');
                }
            }, 10);
        }
    };

    // Fonction pour rendre le contenu d'un élément (title, text, image)
    const renderContent = (contentItems) => {
        return contentItems.map((item, index) => {
            switch(item.type) {
                case 'title':
                    return (
                        <h3 key={index} className="timeline-title">
                            {item.content}
                        </h3>
                    );
                case 'text':
                    return (
                        <p key={index} className="timeline-p mb-4" dangerouslySetInnerHTML={{ __html: item.content }}>
                        </p>
                    );
                case 'image': {
                    // Support du sous-dossier via BASE_URL (Vite)
                    const imgSrc = `${import.meta.env.BASE_URL}images/${item.src}`;
                    return (
                        <figure key={index} className="timeline-image">
                            <img src={imgSrc} alt={item.alt} />
                            {(item.caption || item.captionCredit) && (
                                <figcaption className='text-xs py-2 border-b space-y-2'>
                                    {item.caption && <span className='block color-text-default'>{item.caption}</span>}
                                    {item.captionCredit && <span className='block color-text-weak'>{item.captionCredit}</span>}
                                </figcaption>
                            )}
                        </figure>
                    );
                }
                case 'tweet':
                    return (
                        <figure key={`${selectedFilter}-${index}`} className="timeline-tweet p-6 mb-4 mt-6 mb-6">
                            <TwitterEmbed content={item.content} />
                        </figure>
                    );
                case 'instagram':
                    return (
                        <figure key={`${selectedFilter}-${index}`} className="timeline-instagram p-6 mb-4 mt-6 mb-6">
                            <InstagramEmbed content={item.content} />
                        </figure>
                    );
                case 'youtube':
                    return (
                        <figure key={`${selectedFilter}-${index}`} className="timeline-youtube p-6 mb-4 mt-6 mb-6">
                            <YouTubeEmbed content={item.content} />
                        </figure>
                    );
                default:
                    return null;
            }
        });
    };

    // Fonction pour rendre les éléments d'un filtre
    const renderTimelineElements = (elements) => {
        return elements.map((element) => (
            <div key={element.id}>
                <span className="timeline-entry-date text-sm">{element.date}</span>
                <div className="timeline-entry mb-8 sm:mb-12">
                    <div className="timeline-entry-header">
                        <h3>{element.place}</h3>
                        <h2 className="timeline-entry-title mb-3">{element.title}</h2>
                        
                    </div>
                    <div className="timeline-entry-content">
                        {renderContent(element.content)}
                    </div>
                </div>
            </div>
        ));
    };

    return (

        <div id="timeline" className='App'>
       
            {/* <ul id='timeline-nav' className='flex w-full gap-3 xs:gap-5'>
                {timelineData.timeline.map((item, index) => (
                    <li 
                        key={index}
                        className="cursor-pointer flex flex-col items-center transition-colors flex-1 max-w-20"
                        onClick={() => handleFilterChange(index)}
                        title={item.name}
                    >
                        <figure className="relative w-full h-auto aspect-square rounded-full flex items-center justify-center text-sm font-bold bg-cover bg-center bg-no-repeat"
                            style={{
                                backgroundImage: `url(${getImageForItem(item.img)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {selectedFilter === index && <span className="isActive absolute w-full h-auto aspect-square border-3 border-blick inset-ring-3 inset-ring-white rounded-full"></span>}
                        </figure>
                        <span className={`text-xs text-center mt-2 ${selectedFilter === index ? 'text-blick' : 'text-gray-700'}`}>{item.name}</span>
                    </li>
                ))}
            </ul>

            <div className='mt-4 mb-7'>
                <h1>{timelineData.timeline[selectedFilter]?.name}</h1><span className='h1-after'>, {timelineData.timeline[selectedFilter]?.title}</span>
            </div> */}

            <div id='timeline-content' className='border-l-3 border-blick pt-4 pb-4 pl-4'>
                {timelineData.timeline.map((item, itemIndex) => (
                    <div 
                        key={itemIndex}
                        className={`timeline-content ${
                            selectedFilter === itemIndex 
                                ? 'timeline-content-active block' 
                                : 'timeline-content-hidden hidden'
                        }`}
                    >
                        {renderTimelineElements(item.elements)}
                    </div>
                ))}
            </div>

            <figure id='pub'>
                <h2 className='mb-6'>
                    Retrouvez Richard Werly autour de son nouveau livre «Cette Amérique qui nous déteste» (Ed. Nevicata) 
                </h2>
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                    <div className="w-36 sm:w-48 sm:max-w-48 mx-auto sm:mx-0">
                        <img className="w-full h-auto" src={imgLivre} alt="Couverture du livre 'Cette Amérique qui nous déteste' de Richard Werly" />
                    </div>
                     <div className='text-center sm:text-left'>
                        <div className='mb-4'>
                            <span className="block font-black underline mb-2">Vendredi 7 novembre à 17h30</span>
                            <span className="block">Librairie Payot, Rive Gauche</span>
                            <span className="block">Rue de la Confédération 7</span>
                            <span className="block">Genève</span>
                        </div>

                        <div className='mb-4'>
                            <span className="block font-black underline mb-2">Samedi 8 novembre à 11h00</span>
                            <span className="block">Librairie Payot</span>
                            <span className="block">Place Pépinet 4</span>
                            <span className="block">Lausanne</span>
                        </div>

                        <div className=''>
                            <span className="block font-black underline mb-2">Samedi 8 novembre à 16h00</span>
                            <span className="block">Librairie Le Vent des Routes</span>
                            <span className="block">Boulevard Helvétique 21</span>
                            <span className="block">Genève</span>
                        </div>
                        
                    </div>
                </div>
               
                
               
            </figure>
            {/* {loading && <LoadingOverlay />} */}
        </div>
    );
}

export default App;
