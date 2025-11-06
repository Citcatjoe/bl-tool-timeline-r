import { useEffect, useRef } from 'react';

const TwitterEmbed = ({ content }) => {
    const embedRef = useRef(null);

    useEffect(() => {
        // Charger le script Twitter s'il n'est pas déjà présent
        if (!window.twttr) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            script.referrerPolicy = 'strict-origin-when-cross-origin';
            document.head.appendChild(script);
        }

        // Attendre que le script soit chargé et recharger les widgets
        const loadWidgets = () => {
            if (window.twttr && window.twttr.widgets && embedRef.current) {
                window.twttr.widgets.load(embedRef.current);
            } else {
                // Réessayer dans 100ms si pas encore prêt
                setTimeout(loadWidgets, 100);
            }
        };

        // Lancer le chargement avec un petit délai
        setTimeout(loadWidgets, 50);
    }, []); // Se déclenche seulement au montage du composant

    return (
        <div 
            ref={embedRef}
            className="timeline-tweet-content"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default TwitterEmbed;
