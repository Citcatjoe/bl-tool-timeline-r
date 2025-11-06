const YouTubeEmbed = ({ content }) => {
    // Fonction pour extraire l'ID de la vidéo depuis l'URL
    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYouTubeId(content);
    
    if (!videoId) {
        return <div>URL YouTube invalide</div>;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&start=0&loop=0&mute=0&rel=0&modestbranding=1&showinfo=0`;

    return (
        <div className="timeline-youtube-content">
            <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                maxWidth: '100%'
            }}>
                <iframe
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}
                    src={embedUrl}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`YouTube video ${videoId}`}
                />
            </div>
        </div>
    );
};

export default YouTubeEmbed;
