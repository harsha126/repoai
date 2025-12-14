import { Plus } from "lucide-react";
import React from "react";
import RepoIngestionList from "./RepoIngestionList";
import Modal from "./Modal";
import RepoChatList from "./RepoChatList";
import ChatWindow from "./ChatWindow";

const DashBoard = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const openModal = () => setIsOpen(true);
    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <>
            <div className="flex flex-1 overflow-hidden relative h-screen">
                <div className="w-80 bg-base-200 flex-none flex flex-col border-r border-base-content/10 overflow-y-auto">
                    <div className="p-4">
                        <button
                            onClick={openModal}
                            className="btn btn-primary normal-case gap-2 my-4 w-full"
                        >
                            <Plus className="w-4 h-4" />
                            Add GitHub repo
                        </button>
                        <div className="mb-8 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-base-200">
                            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3 px-1">
                                Ingestion Status
                            </h3>
                            <RepoIngestionList />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-3 px-1">
                                Chat Ready
                            </h3>
                            <RepoChatList />
                        </div>
                    </div>
                </div>
                <div className="border-t border-base-content/10 flex-1 flex flex-col overflow-hidden min-w-80">
                    <ChatWindow />
                </div>
            </div>
            {isOpen && <Modal closeModal={closeModal} />}
        </>
    );
};

export default DashBoard;
