import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

const SpeakerProfileContainer = styled.div`
    padding: 0 2rem;
    margin: 0 auto;
`;

const SpeakerProfileHeader = styled.div`
    display: flex;
    flex-direction: row;
`;


const SpeakerProfilePicture = styled.img`
    width: 30%;
    margin-right: 1rem;
`

// Displays the details of a speaker.
const SpeakerProfile = ({ speaker }) => {
    return (
        <SpeakerProfileContainer>
            <SpeakerProfileHeader>
                <SpeakerProfilePicture src={`https://via.placeholder.com/300x200?text=${speaker.name}`} alt='Profile' />
                <div>
                    <h3>{moment(speaker.date).format('LL')}</h3>
                    <h4>{speaker.name}</h4>
                    <p>{speaker.description}</p>
                </div>
            </SpeakerProfileHeader>
          
           
        </SpeakerProfileContainer>
    )
}

export default SpeakerProfile;
