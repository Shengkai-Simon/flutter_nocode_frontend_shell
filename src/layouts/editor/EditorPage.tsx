import React from 'react';
import {useSearchParams, Link, useLocation} from 'react-router-dom';
import { IframeChannelProvider, useIframeChannel } from '@/hooks/useIframeChannel.tsx';
import { AiAssistant } from '@/components/assistant/AiAssistant.tsx';
import { Button } from '@/components/ui/button.tsx';
import { navRoutes } from '@/lib/navRoutes.ts';
import { api } from '@/lib/api.ts';
import { apiPaths } from '@/lib/apiPaths.ts';

function EditorView() {
    const location = useLocation();
    const { iframeRef, isHandshakeComplete } = useIframeChannel();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('id');
    const flutterAppUrl = navRoutes.editor(projectId!);

    // Always holds the latest state from Flutter — updated immediately on every postMessage,
    // so beforeunload never reads stale data regardless of debounce timing.
    const latestProjectDataRef = React.useRef<{ version: number; project: object } | null>(null);
    const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const patchToBackend = React.useCallback((projectData: { version: number; project: object }, keepalive = false) => {
        const patch = [
            { op: 'add', path: '/version', value: projectData.version },
            { op: 'add', path: '/project', value: projectData.project },
        ];
        if (keepalive) {
            fetch(apiPaths.updateProjectData(projectId!), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json-patch+json' },
                body: JSON.stringify(patch),
                keepalive: true,
                credentials: 'include',
            });
        } else {
            api.patch(apiPaths.updateProjectData(projectId!), patch).catch((err) => {
                console.error('[EditorPage] Auto-save failed:', err);
            });
        }
    }, [projectId]);

    // Receive state from Flutter: update ref immediately (always fresh),
    // then debounce the actual network call to avoid request flooding.
    React.useEffect(() => {
        if (!projectId) return;
        const handleProjectUpdate = (event: Event) => {
            const projectData = JSON.parse((event as CustomEvent).detail) as { version: number; project: object };
            latestProjectDataRef.current = projectData;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => patchToBackend(projectData), 1500);
        };
        window.addEventListener('flutterProjectUpdate', handleProjectUpdate);
        return () => {
            window.removeEventListener('flutterProjectUpdate', handleProjectUpdate);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [projectId, patchToBackend]);

    // On page unload: cancel pending debounce and immediately save with keepalive.
    // The ref is always up-to-date, so no data is ever lost.
    React.useEffect(() => {
        if (!projectId) return;
        const handleBeforeUnload = () => {
            if (!latestProjectDataRef.current) return;
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            patchToBackend(latestProjectDataRef.current, true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [projectId, patchToBackend]);

    return (
        <>
            <iframe
                key={location.key} // Use location.key to ensure that the iframe is reloaded every time the route changes
                ref={iframeRef}
                src={flutterAppUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Flutter Editor"
            />
            {isHandshakeComplete && (
                <AiAssistant projectId={projectId!} />
            )}
        </>
    );
}

export default function EditorPage() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('id');

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-lg text-destructive">Error: The project ID is missing.</p>
                <Link to={navRoutes.dashboard}>
                    <Button variant="outline">Return to the list of items</Button>
                </Link>
            </div>
        )
    }

    return (
        <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
            <IframeChannelProvider>
                <EditorView />
            </IframeChannelProvider>
        </div>
    );
}
