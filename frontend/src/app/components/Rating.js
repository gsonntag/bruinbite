// rating component
export default function Rating({ rating }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <span className="font-semibold text-gray-800 mr-1">{rating.user.username}</span>
                        <span className="text-sm text-gray-500">rated</span>
                        <span className="font-semibold text-gray-800 ml-1">{rating.dish.name}</span>
                    </div>
                    <div className="flex items-center mb-3">
                        <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                            <span className="text-yellow-500 mr-1">★</span>
                            <span className="text-sm font-medium text-blue-700">{rating.score}/5</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {rating.comment && rating.comment.length > 0 && (
                <div className="mb-4">
                    <p className="text-gray-700 italic">&quot;{rating.comment}&quot;</p>
                </div>
            )}
            
            <div className="text-sm text-gray-500">
                {new Date(rating.created_at).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })} at {new Date(rating.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
    );
};